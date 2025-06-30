npm install -g @ionic/cli

ionic serve --host=0.0.0.0
npm run build
npx cap add android

npx cap sync android
