import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import koaCompress from 'koa-compress';
import route from 'koa-route';
import koaSend from 'koa-send';
import { detectCrawler } from './crawlers';
import logger from './logger'
import koaLogger from 'koa-logger-winston'
import path from 'path';
import puppeteer from 'puppeteer';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';

import { Renderer, ScreenshotError } from './renderer';
import { Config, ConfigManager } from './config';
import counter from './counter';

const marketRegex = /https:\/\/.*?\/(.*?)\//

const concurrencyKillCount = Number(process.env.CONCURRENCY_KILL_COUNT) || 5;

/**
 * Rendertron rendering service. This runs the server which routes rendering
 * requests through to the renderer.
 */
export class Rendertron {
  app: Koa = new Koa();
  private config: Config = ConfigManager.config;
  private renderer: Renderer | undefined;
  private port = process.env.PORT || null;
  private host = process.env.HOST || null;

  async createRenderer(config: Config) {
    const browser = await puppeteer.launch({ args: config.puppeteerArgs });

    browser.on('disconnected', () => {
      this.createRenderer(config);
    });

    this.renderer = new Renderer(browser, config);
  }

  async initialize(config?: Config) {
    // Load config
    this.config = config || (await ConfigManager.getConfiguration());

    this.port = this.port || this.config.port;
    this.host = this.host || this.config.host;

    await this.createRenderer(this.config);

    this.app.use(koaLogger(logger));

    this.app.use(koaCompress());

    this.app.use(bodyParser());

    this.app.use(
      route.get('/', async (ctx: Koa.Context) => {
        await koaSend(ctx, 'index.html', {
          root: path.resolve(__dirname, '../src'),
        });
      })
    );
    this.app.use(
      route.get('/_ah/health', this.handleHealthRequest.bind(this))
    );

    // Optionally enable cache for rendering requests.
    if (this.config.cache === 'datastore') {
      const { DatastoreCache } = await import('./datastore-cache');
      const datastoreCache = new DatastoreCache();
      this.app.use(
        route.get('/invalidate/:url(.*)', datastoreCache.invalidateHandler())
      );
      this.app.use(
        route.get('/invalidate/', datastoreCache.clearAllCacheHandler())
      );
      this.app.use(datastoreCache.middleware());
    } else if (this.config.cache === 'memory') {
      const { MemoryCache } = await import('./memory-cache');
      const memoryCache = new MemoryCache();
      this.app.use(
        route.get('/invalidate/:url(.*)', memoryCache.invalidateHandler())
      );
      this.app.use(
        route.get('/invalidate/', memoryCache.clearAllCacheHandler())
      );
      this.app.use(memoryCache.middleware());
    } else if (this.config.cache === 'filesystem') {
      const { FilesystemCache } = await import('./filesystem-cache');
      const filesystemCache = new FilesystemCache(this.config);
      this.app.use(
        route.get('/invalidate/:url(.*)', filesystemCache.invalidateHandler())
      );
      this.app.use(
        route.get('/invalidate/', filesystemCache.clearAllCacheHandler())
      );
      this.app.use(new FilesystemCache(this.config).middleware());
    }

    this.app.use(
      route.get('/render/:url(.*)', this.handleRenderRequest.bind(this))
    );
    this.app.use(
      route.get('/screenshot/:url(.*)', this.handleScreenshotRequest.bind(this))
    );
    this.app.use(
      route.post(
        '/screenshot/:url(.*)',
        this.handleScreenshotRequest.bind(this)
      )
    );

    return this.app.listen(+this.port, this.host, () => {
      console.log(`Listening on port ${this.port}`);
    });
  }

  /**
   * Checks whether or not the URL is valid. For example, we don't want to allow
   * the requester to read the file system via Chrome.
   */
  restricted(href: string): boolean {
    const parsedUrl = url.parse(href);
    const protocol = parsedUrl.protocol || '';

    if (!protocol.match(/^https?/)) {
      return true;
    }

    if (parsedUrl.hostname && parsedUrl.hostname.match(/\.internal$/)) {
      return true;
    }

    if (!this.config.renderOnly.length) {
      return false;
    }

    for (let i = 0; i < this.config.renderOnly.length; i++) {
      if (href.startsWith(this.config.renderOnly[i])) {
        return false;
      }
    }

    return true;
  }

  async handleHealthRequest(ctx: Koa.Context) {
    const { concurrency, count } = counter.getCounts()

    if (concurrency <= concurrencyKillCount) {
      logger.info(`Health check passed <= ${concurrencyKillCount}`, { render_concurrency: concurrency, render_count: count })
      ctx.status = 200;
      ctx.body = "OK";
      return;
    }

    logger.error(`Health check failed > ${concurrencyKillCount}`, { render_concurrency: concurrency, render_count: count })
    ctx.status = 500;
    ctx.body = "ERROR";
  }

  async handleRenderRequest(ctx: Koa.Context, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    const renderId = uuidv4()
    const started = performance.now();

    const userAgent = ctx.request.headers['user-agent'] || undefined;
    const renderUrl = ctx.url.replace('/render/','')
    const marketMatch = renderUrl.match(marketRegex)
    const market = marketMatch ? marketMatch[1] : "Not Found"
    const renderCrawler =  userAgent ? detectCrawler(userAgent) : "Not Set";
    const renderUserAgent =  userAgent || "Not Set";

    const startCounts = counter.increase();

    const renderExtraRequest = {
      'render_id': renderId,
      'render_crawler': renderCrawler,
      'render_url': renderUrl,
      'render_user_agent': renderUserAgent,
      'render_market': market,
      'render_count': startCounts.count,
      'render_concurrency': startCounts.concurrency,
    }
    logger.info("render request", renderExtraRequest)

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    const serialized = await this.renderer.serialize(
      url,
      mobileVersion,
      renderId,
      started,
      ctx.query.timezoneId,
    );

    for (const key in this.config.headers) {
      ctx.set(key, this.config.headers[key]);
    }

    // Mark the response as coming from Rendertron.
    ctx.set('x-renderer', 'rendertron');
    ctx.set('x-render-id', renderId);
    // Add custom headers to the response like 'Location'
    serialized.customHeaders.forEach((value: string, key: string) =>
      ctx.set(key, value)
    );
    ctx.status = serialized.status;
    ctx.body = serialized.content;

    const timeout = !!serialized.customHeaders.get('timeout');
    const finished = performance.now();
    const duration = parseFloat((finished - started).toFixed(0));

    const endCounts = counter.decrease();

    const renderExtraDetails = {
      'render_id': renderId,
      'render_crawler': renderCrawler,
      'render_status': ctx.status,
      'render_url': renderUrl,
      'render_user_agent': renderUserAgent,
      'render_duration_ms': duration,
      'render_market': market,
      'render_timeout': timeout,
      'render_count': endCounts.count,
      'render_concurrency': endCounts.concurrency,
      'render_varnish_cache': serialized.varnishCache || 'unknown'
    }
    logger.info("render details", renderExtraDetails)
  }

  async handleScreenshotRequest(ctx: Koa.Context, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    const dimensions = {
      width: Number(ctx.query['width']) || this.config.width,
      height: Number(ctx.query['height']) || this.config.height,
    };

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    try {
      const img = await this.renderer.screenshot(
        url,
        mobileVersion,
        dimensions,
        ctx.query.timezoneId
      );

      for (const key in this.config.headers) {
        ctx.set(key, this.config.headers[key]);
      }

      ctx.set('Content-Type', 'image/jpeg');
      ctx.set('Content-Length', img.length.toString());
      ctx.body = img;
    } catch (error) {
      const err = error as ScreenshotError;
      ctx.status = err.type === 'Forbidden' ? 403 : 500;
    }
  }
}

async function logUncaughtError(error: Error) {
  console.error('Uncaught exception');
  console.error(error);
  process.exit(1);
}

// The type for the unhandleRejection handler is set to contain Promise<any>,
// so we disable that linter rule for the next line
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
async function logUnhandledRejection(reason: unknown, _: Promise<any>) {
  console.error('Unhandled rejection');
  console.error(reason);
  process.exit(1);
}

// Start rendertron if not running inside tests.
if (!module.parent) {
  const rendertron = new Rendertron();
  rendertron.initialize();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUnhandledRejection);
}
