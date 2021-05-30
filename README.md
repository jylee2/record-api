# To run:
```
deno run --allow-net --allow-env --allow-write --allow-read --allow-plugin --unstable app.ts
```
or
```
deno install -qAf --unstable https://deno.land/x/denon@2.4.7/denon.ts
denon --init
denon start
```

# To develop:
```
git remote add origin https://github.com/jylee2/record-api.git
```

# To deploy to heroku:
- Use https://github.com/chibat/heroku-buildpack-deno.git
- Edit the Procfile, e.g.:
  ```
  web: deno run --allow-net --allow-env --allow-write --allow-read --allow-plugin --unstable app.ts --port=${PORT}
  ```
- git push origin master
- go to Heroku > Manual deploy > select master branch and click Deploy Branch