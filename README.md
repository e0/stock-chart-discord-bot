# `stock-chart-discord-bot`

Discord bot for posting stock charts. Based on [stock-chart-generator](https://github.com/e0/stock-chart-generator) and [stock-chart-worker](https://github.com/e0/stock-chart-worker).

## Prerequisites

- [Node.js](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com)

## Get started

1. Install dependencies: `yarn`
2. Add a `.env` file in the project root with the following lines, fill in your own values.

```
DISCORD_API_TOKEN=
STOCK_CHART_GENERATOR_URL=
STOCK_CHART_WORKER_URL=
```

3. Run in dev: `yarn dev`
4. For deployment, TBD.

## Commands

- `!chart SYMBOL`: generates a daily chart for the provided symbol
