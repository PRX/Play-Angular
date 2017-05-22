FROM mhart/alpine-node:6.5

MAINTAINER PRX <sysadmin@prx.org>
LABEL org.prx.app="yes"

# install git, aws-cli
RUN apk --no-cache add git ca-certificates \
    python py-pip py-setuptools groff less && \
    pip --no-cache-dir install awscli

# install PRX aws-secrets scripts
RUN git clone -o github https://github.com/PRX/aws-secrets
RUN cp ./aws-secrets/bin/* /usr/local/bin

ENV TINI_VERSION v0.9.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini

WORKDIR /app
EXPOSE 4300

ADD . ./

# TODO: someday https://github.com/sass/node-sass/issues/1589 will happen,
# and building this will be way faster.
RUN apk --update add --no-cache --virtual build-dependencies \
    python=2.7.12-r0 git-perl bash make gcc g++ && \
    npm set progress=false && \
    npm install --no-optional --unsafe-perm --loglevel error && \
    npm run build && \
    npm prune --production --loglevel error && \
    npm cache clean && \
    apk del build-dependencies && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

ENTRYPOINT ["/tini", "--", "./bin/application"]
CMD [ "serve" ]
