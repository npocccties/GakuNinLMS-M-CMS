import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <script src="ffmpeg.min.js"></script>
        <script src="browser.js"></script>
        <style>{`body {font-family: system-ui;}`}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
