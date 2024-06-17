const mobile = 'Mobile'
const googleBot = 'Googlebot'
const googleBotImage = 'Googlebot-Image'
const googleBotVideo = 'Googlebot-Video'
const googleStoreBot = 'Storebot-Google'
const googleInspectBot = 'Google-InspectionTool'
const googleOtherBot = 'GoogleOther'
const googleAdsBot = 'AdsBot-Google'
const googleAdSenseBot = 'Mediapartners-Google'
const googleReadAloudBot = 'Google-Read-Aloud'

const mobileRegEx = new RegExp(` ${mobile} `)
const googleBotRegEx = new RegExp(` ${googleBot}\/`)
const googleBotImageRegEx = new RegExp(`${googleBotImage}\/`)
const googleBotVideoRegEx = new RegExp(`${googleBotVideo}\/`)
const googleStoreBotRegEx = new RegExp(` ${googleStoreBot}\/`)
const googleInspectBotRegEx = new RegExp(` ${googleInspectBot}\/`)
const googleAdsBotRegEx = new RegExp(googleAdsBot)
const googleOtherBotRegEx = new RegExp(googleOtherBot)
const googleAdSenseMobileBotRegEx = new RegExp(`${googleAdSenseBot}\/`)
const googleAdSenseBotRegEx = new RegExp(googleAdSenseBot)
const googleReadAloudBotRegEx = new RegExp(googleReadAloudBot)

const otherBot = /\b\w*bot\w*\b/i;

const appendMobileString = (isMobile: boolean) => isMobile ? ` Mobile` : ''

// See https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
const detectCrawler = (userAgent: any) => {
  const isMobile = mobileRegEx.test(userAgent)

  // GoogleBot Mobile & Desktop
  if (googleBotRegEx.test(userAgent)) {
    return `${googleBot}${appendMobileString(isMobile)}`
  }

  // Google AdsBot Mobile & Desktop
  if (googleAdsBotRegEx.test(userAgent)) {
    return `${googleAdsBot}${appendMobileString(isMobile)}`
  }

  // Google AdSense Mobile
  if (googleAdSenseMobileBotRegEx.test(userAgent)) {
    return `AdSense Mobile`
  }

  // Google AdSense Mobile
  if (googleAdSenseBotRegEx.test(userAgent)) {
    return `AdSense`
  }

  // Googlebot Image
  if (googleBotImageRegEx.test(userAgent)) {
    return googleBotImage
  }

  // Googlebot News
  // Uses Googlebot

  // Googlebot Video
  if (googleBotVideoRegEx.test(userAgent)) {
    return googleBotVideo
  }

  // Google StoreBot Mobile & Desktop
  if (googleStoreBotRegEx.test(userAgent)) {
    return `${googleStoreBot}${appendMobileString(isMobile)}`
  }

  // Google Inspection Tool Mobile & Desktop
  if (googleInspectBotRegEx.test(userAgent)) {
    return `${googleInspectBot}${appendMobileString(isMobile)}`
  }

  // Google Other
  if (googleOtherBotRegEx.test(userAgent)) {
    return googleOtherBot
  }

  // Google Read Aloud Mobile & Desktop
  if (googleReadAloudBotRegEx.test(userAgent)) {
    return `${googleReadAloudBot}${appendMobileString(isMobile)}`
  }

  // Google Extended & Apis-google & Google-Safety
  // Not implemented

  // Match any string with bot in it
  const hasOtherBot = userAgent.match(otherBot)
  if (hasOtherBot) {
    return hasOtherBot[0]
  }

  // default simply return the useragent
  return userAgent
}

export { detectCrawler }