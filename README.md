npm install -g @ionic/cli

ionic serve --host=0.0.0.0
npm run build
npx cap add android

npx cap sync android

# build icon
pnpm remove @codetrix-studio/capacitor-google-auth
rm -rf node_modules pnpm-lock.yaml
npm install sharp --legacy-peer-deps --force

# Test
npx @capacitor/assets generate

# install release
adb install -r android/app/build/outputs/apk/release/app-release.apk