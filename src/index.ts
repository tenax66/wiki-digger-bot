import { Button, Components, DiscordHono } from 'discord-hono'

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
      // ランダムなWikipediaページを取得
      const response = await fetch('https://ja.wikipedia.org/api/rest_v1/page/random/summary')
      const data = await response.json() as {
        title: string
        extract: string
        content_urls: {
          desktop: {
            page: string
          }
        }
      }

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

export default app
