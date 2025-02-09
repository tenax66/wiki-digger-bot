import { Button, Components, DiscordHono } from 'discord-hono'

interface Env {
  DISCORD_WEBHOOK_URL?: string
}

async function getRandomWiki() {
  const response = await fetch('https://ja.wikipedia.org/api/rest_v1/page/random/summary')
  const data = await response.json() as {
    title: string
    extract: string
    content_urls: { desktop: { page: string } }
  }
  return data
}

async function postToDiscord(webhookUrl: string, data: Awaited<ReturnType<typeof getRandomWiki>>) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `**今日のWikipedia**\n\n**${data.title}**\n\n${data.extract}\n\n${data.content_urls.desktop.page}`
    })
  })
}

const app = new DiscordHono()
  .command('help', c =>
    c.res({
      content: `text: ${c.var.text}`,
      components: new Components().row(
        new Button('https://github.com/tenax66/wiki-digger-bot', ["📑", 'Docs'], 'Link'),
        new Button('delete-self', ['🗑️', 'Delete'], 'Secondary'),
      ),
    }),
  )
  .command('wiki', async c => {
    try {
      const data = await getRandomWiki()
      return c.res({
        content: `**${data.title}**\n\n${data.extract}\n\n詳細: ${data.content_urls.desktop.page}`,
        components: new Components().row(
          new Button(data.content_urls.desktop.page, ['📖', 'ページを開く'], 'Link'),
          new Button('delete-self', ['🗑️', '削除'], 'Secondary'),
        ),
      })
    } catch (error) {
      return c.res('Wikipediaからの情報取得に失敗しました。')
    }
  })
  .component('delete-self', c => c.resDeferUpdate(c.followupDelete))

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env) => {
    if (!env.DISCORD_WEBHOOK_URL) return
    try {
      const data = await getRandomWiki()
      await postToDiscord(env.DISCORD_WEBHOOK_URL, data)
    } catch (error) {
      console.error('Failed to post random wiki:', error)
    }
  }
}
