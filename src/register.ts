import { Command, Option, register } from 'discord-hono'

const commands = [
  new Command('help', 'ヘルプを表示します').options(new Option('text', 'with text')),
  new Command('wiki', 'ランダムなWikipediaページを表示します'),
]

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
)
