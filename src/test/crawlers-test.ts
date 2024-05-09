import test, { ExecutionContext } from 'ava';
import { detectCrawler } from '../crawlers';

test('detect Googlebot', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36';
  t.is(detectCrawler(userAgent), 'Googlebot');
});

test('detect Googlebot Mobile', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
  t.is(detectCrawler(userAgent), 'Googlebot Mobile');
});

test('detect AdsBot', (t: ExecutionContext) => {
  const userAgent = 'AdsBot-Google (+http://www.google.com/adsbot.html)';
  t.is(detectCrawler(userAgent), 'AdsBot-Google');
});

test('detect AdsBot Mobile', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)';
  t.is(detectCrawler(userAgent), 'AdsBot-Google Mobile');
});

test('detect AdsSense', (t: ExecutionContext) => {
  const userAgent = 'Mediapartners-Google';
  t.is(detectCrawler(userAgent), 'AdSense');
});

test('detect AdsSense Mobile', (t: ExecutionContext) => {
  const userAgent = '(Various mobile device types) (compatible; Mediapartners-Google/2.1; +http://www.google.com/bot.html)';
  t.is(detectCrawler(userAgent), 'AdSense Mobile');
});

test('detect Googlebot-Image', (t: ExecutionContext) => {
  const userAgent = 'Googlebot-Image/1.0';
  t.is(detectCrawler(userAgent), 'Googlebot-Image');
});

test('detect Googlebot-Video', (t: ExecutionContext) => {
  const userAgent = 'Googlebot-Video/1.0';
  t.is(detectCrawler(userAgent), 'Googlebot-Video');
});

test('detect Storebot', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (X11; Linux x86_64; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Safari/537.36';
  t.is(detectCrawler(userAgent), 'Storebot-Google');
});

test('detect Storebot Mobile', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012; Storebot-Google/1.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36';
  t.is(detectCrawler(userAgent), 'Storebot-Google Mobile');
});

test('detect Google-InspectionTool', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)';
  t.is(detectCrawler(userAgent), 'Google-InspectionTool');
});

test('detect Google-InspectionTool Mobile', (t: ExecutionContext) => {
  const userAgent = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)';
  t.is(detectCrawler(userAgent), 'Google-InspectionTool Mobile');
});

test('detect GoogleOther', (t: ExecutionContext) => {
  const userAgent = 'GoogleOther';
  t.is(detectCrawler(userAgent), 'GoogleOther');
});

test('detect Genericbot', (t: ExecutionContext) => {
  const userAgent = 'Genericbot';
  t.is(detectCrawler(userAgent), 'Genericbot');
});

test('detect Generic bot at start', (t: ExecutionContext) => {
  const userAgent = 'StartBot with stuff after';
  t.is(detectCrawler(userAgent), 'StartBot');
});

test('detect Generic bot in middle', (t: ExecutionContext) => {
  const userAgent = 'Stuff at start MiddleBot with stuff after';
  t.is(detectCrawler(userAgent), 'MiddleBot');
});

test('detect Generic bot at end', (t: ExecutionContext) => {
  const userAgent = 'Stuff at start EndBot';
  t.is(detectCrawler(userAgent), 'EndBot');
});

test('no bot detected return userAgent', (t: ExecutionContext) => {
  const userAgent = 'userAgentString';
  t.is(detectCrawler(userAgent), 'userAgentString');
});

test('handle empty userAgent', (t: ExecutionContext) => {
  const userAgent = '';
  t.is(detectCrawler(userAgent), '');
});