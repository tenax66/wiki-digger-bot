import { Button, Components, DiscordHono } from 'discord-hono'

interface Env {
  DISCORD_WEBHOOK_URL?: string
}

async function getRandomWiki() {
  console.log('Fetching random Wikipedia page...')
  try {
    const response = await fetch('https://ja.wikipedia.org/api/rest_v1/page/random/summary', {
      headers: {
        'User-Agent': 'WikiDiggerBot/1.0 (https://github.com/yourusername/wiki-digger-bot)'
      }
    })
    const data = await response.json() as {
      title: string
      extract: string
      content_urls: { desktop: { page: string } }
    }
    console.log(`Successfully fetched Wikipedia page: "${data.title}"`)
    return data
  } catch (error) {
    console.error('Failed to fetch Wikipedia page:', error)
    throw error
  }
}

async function postToDiscord(webhookUrl: string, data: Awaited<ReturnType<typeof getRandomWiki>>) {
  console.log(`Posting to Discord webhook: ${webhookUrl}`)
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `**今日のWikipedia**\n\n**${data.title}**\n\n${data.extract}\n\n${data.content_urls.desktop.page}`
      })
    })
    
    if (!response.ok) {
      throw new Error(`Discord webhook failed with status: ${response.status}`)
    }
    
    console.log(`Successfully posted to Discord webhook: ${webhookUrl}`)
  } catch (error) {
    console.error(`Failed to post to Discord webhook ${webhookUrl}:`, error)
    throw error
  }
}

const app = new DiscordHono()
  .command('help', c => {
    console.log('Help command executed')
    return c.res({
      content: `text: ${c.var.text}`,
      components: new Components().row(
        new Button('https://github.com/tenax66/wiki-digger-bot', ["📑", 'Docs'], 'Link'),
        new Button('delete-self', ['🗑️', 'Delete'], 'Secondary'),
      ),
    })
  })
  .command('wiki', async c => {
    console.log('Wiki command executed')
    try {
      const data = await getRandomWiki()
      console.log('Sending wiki response to Discord')
      return c.res({
        content: `**${data.title}**\n\n${data.extract}\n\n詳細: ${data.content_urls.desktop.page}`,
        components: new Components().row(
          new Button(data.content_urls.desktop.page, ['📖', 'ページを開く'], 'Link'),
          new Button('delete-self', ['🗑️', '削除'], 'Secondary'),
        ),
      })
    } catch (error) {
      console.error('Wiki command failed:', error)
      return c.res('Wikipediaからの情報取得に失敗しました。')
    }
  })
  .component('delete-self', c => {
    console.log('Delete component executed')
    return c.resDeferUpdate(c.followupDelete)
  })

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env) => {
    console.log('Scheduled task started')
    
    if (!env.DISCORD_WEBHOOK_URL) {
      console.log('No DISCORD_WEBHOOK_URL configured, skipping scheduled task')
      return
    }
    
    const urls = env.DISCORD_WEBHOOK_URL.split(',').map(url => url.trim()).filter(Boolean)
    console.log(`Found ${urls.length} webhook URLs to post to`)
    
    try {
      const data = await getRandomWiki()
      console.log(`Posting to ${urls.length} Discord webhooks...`)
      
      const results = await Promise.allSettled(urls.map(url => postToDiscord(url, data)))
      
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length
      
      console.log(`Scheduled task completed: ${successful} successful, ${failed} failed`)
      
      if (failed > 0) {
        console.error('Some webhook posts failed:', results.filter(result => result.status === 'rejected'))
      }
    } catch (error) {
      console.error('Scheduled task failed:', error)
    }
  }
}
