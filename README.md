# PRX Embed Player

Embeddable audio playback!

# Developing

TODO: hot-reloading not working yet via docker-compose, so you probably want
to just develop locally for now.

Generally, you'll want to look at the `/demo` page for various usages of this
project.  Or copy the iframes from that page, and open them separately.

## Docker

TODO: port prx-ng-serve to this project, to make the dev-server work.

```sh
cp env-example .env

# build a docker image
docker-compose build

# run docker PROD server (no reloading)
docker-compose up
open "http://play.prx.docker/demo"

# run the tests (ci command uses phantomjs)
docker-compose run play ci
```

To develop locally:

```sh
cp env-example .env
yarn

# run the dev server
yarn start
open "http://localhost:4300/demo"

# run the tests
yarn test
```

# License

[MIT License](https://opensource.org/licenses/MIT)

