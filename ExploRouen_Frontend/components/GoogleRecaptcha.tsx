import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface GoogleRecaptchaProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

const GoogleRecaptcha: React.FC<GoogleRecaptchaProps> = ({ 
  onVerify,
  siteKey = '6LfPvyssAAAAAAV1fAKQ83Ox2Dy9DQEDoG0wECjs'
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80px;
            background-color: transparent;
          }
          #recaptcha-container {
            transform: scale(0.9);
            transform-origin: center center;
          }
        </style>
      </head>
      <body>
        <div id="recaptcha-container"></div>
        <script>
          function onRecaptchaSuccess(token) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              token: token
            }));
          }

          function onRecaptchaExpired() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'expired'
            }));
          }

          function onRecaptchaError() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error'
            }));
          }

          window.onload = function() {
            try {
              grecaptcha.render('recaptcha-container', {
                'sitekey': '${siteKey}',
                'callback': onRecaptchaSuccess,
                'expired-callback': onRecaptchaExpired,
                'error-callback': onRecaptchaError,
                'theme': 'light'
              });
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loaded'
              }));
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: error.toString()
              }));
            }
          };
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'loaded':
          setLoading(false);
          break;
        case 'success':
          onVerify(data.token);
          break;
        case 'expired':
          onVerify('');
          break;
        case 'error':
          console.error('reCAPTCHA error:', data.message);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1E40AF" />
          <Text style={styles.loadingText}>Chargement de la vérification...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={[styles.webview, loading && styles.hidden]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    marginBottom: 16,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    height: 80,
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default GoogleRecaptcha;
