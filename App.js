import React, { useEffect, useRef, useState } from 'react'
import type { Node } from 'react'
import { Platform, SafeAreaView, Text, View } from 'react-native'
import { useNetInfo } from '@react-native-community/netinfo'
import SplashScreen from 'react-native-splash-screen'
import { WebView } from 'react-native-webview'
import httpBridge from 'react-native-http-bridge'
import RNFS from 'react-native-fs'

import NetworkError from './src/components/NetworkError'
import askPermission from './src/lib/askPermission'

const backgroundStyle = {
  flex: 1,
  backgroundColor: 'red'
}

const base_url = 'https://rando.ecrins-parcnational.fr'

const PORT = 8390

// path where files will be served from (index.html here)
let path = RNFS.DocumentDirectoryPath

const cacheFile = async (fileName, isConnected) => {
  const _url =  base_url + fileName
  const _path = `${path}${fileName === '/' ? '/root.html' : fileName}`

  let directory = _path.split('/')
  directory.pop()
  directory = directory.join('/')

  await RNFS.mkdir(directory)

  const exists = await RNFS.exists(_path)

  if (!exists || isConnected) {
    console.log('Caching ', _url, 'to', _path)
    const job = RNFS.downloadFile({
      fromUrl: _url,
      toFile: _path,
    })

    await job.promise
  }

  let encoding = 'utf8'
  if (_path.includes('.png') || _path.includes('.ico') || _path.includes('.jpg') || _path.includes('.mp4')) encoding = 'base64'

  if (encoding === 'base64') {
    const base64Result = await RNFS.readFile(_path, encoding)

    return base64Result.toString()
  } else return RNFS.readFile(_path, encoding)
}

const App: () => Node = () => {
  const [havePermission, setHavePermission] = useState(false)
  const [uri, setUri] = useState('')
  const netInfo = useNetInfo()
  const webRef = useRef()

  useEffect(() => {
    startServer()

    setTimeout(() => {
      SplashScreen.hide()
    }, 4000)

    askPermission().then(() => setHavePermission(true))
  }, [])

  const startServer = async () => {
    await httpBridge.start(PORT, 'http_service', async (request) => {

      const response = await cacheFile(request.url, netInfo.isConnected)

      let type
      if (request.url.includes('.html')) type = 'text/html'
      else if (request.url.includes('.js')) type = 'application/javascript'
      else if (request.url.includes('.css')) type = 'text/css'
      else if (request.url.includes('.png')) type = 'image/png'
      else if (request.url.includes('.jpg')) type = 'image/jpeg'
      else if (request.url.includes('.mp4')) type = 'video/mp4'

      console.log('request.url:', request.url, type)

      if (response) httpBridge.respond(request.requestId, 200, type, response)
      else httpBridge.respond(request.requestId, 404, 'text/plain', 'not found')
    });

    setUri(`http://localhost:${PORT}/`)
  }


  return (
    <SafeAreaView style={backgroundStyle}>
      {netInfo.isConnected && havePermission ? (
        <WebView
          ref={webRef}
          userAgent={`in-app Mobile ${Platform.OS}`}
          source={{ uri }}
          allowsInlineMediaPlayback
          originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState
          scalesPageToFit
          javaScriptEnabled={true}
          cacheEnabled={true}
        />
      ) : (
        <NetworkError />
      )}
    </SafeAreaView>
  )
}

export default App
