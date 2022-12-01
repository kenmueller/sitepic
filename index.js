import express from 'express'
import puppeteer from 'puppeteer'

const PORT = process.env.PORT ?? '3000'

const app = express()

const browserPromise = puppeteer.launch({
	args: ['--no-sandbox', '--disable-setuid-sandbox']
})

const validWaitParameters = [
	'domcontentloaded',
	'load',
	'networkidle0',
	'networkidle2'
]

const maxWidth = 1920
const maxHeight = 1080

app.get('/', async (req, res) => {
	res.header('access-control-allow-origin', '*')

	const { url, wait, width: _width, height: _height } = req.query

	try {
		if (!url) throw new Error()
		new URL(url)
	} catch {
		return res
			.status(400)
			.send('The "url" query parameter must be a valid url')
	}

	if (!(wait && validWaitParameters.includes(wait)))
		return res
			.status(400)
			.send(
				`The "wait" query parameter must be one of ${validWaitParameters
					.map(x => `"${x}"`)
					.join(', ')}`
			)

	const width = Number.parseInt(_width)

	if (Number.isNaN(width) || width <= 0 || width > maxWidth)
		return res
			.status(400)
			.send(
				`The "width" query parameter must be a valid number between 0 and ${maxWidth}`
			)

	const height = Number.parseInt(_height)

	if (Number.isNaN(height) || height <= 0 || height > maxHeight)
		return res
			.status(400)
			.send(
				`The "height" query parameter must be a valid number between 0 and ${maxHeight}`
			)

	try {
		const page = await (await browserPromise).newPage()

		try {
			await page.setViewport({ width, height })

			await page.goto(url, { waitUntil: wait })
			const image = await page.screenshot({ fullPage: true })

			res.type('png').send(image)
		} finally {
			await page.close()
		}
	} catch (error) {
		res.status(500).send(error?.message ?? 'An unknown error occurred')
	}
})

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})
