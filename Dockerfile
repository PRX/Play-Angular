FROM mhart/alpine-node:14

MAINTAINER PRX <sysadmin@prx.org>
LABEL org.prx.app="yes"
LABEL org.prx.spire.publish.ecr="WEB_SERVER"

ENV APP_HOME /app
ENV HOME=$APP_HOME
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME
EXPOSE 4300

RUN apk --no-cache add git ca-certificates \
    python py-pip py-setuptools groff less && \
    pip --no-cache-dir install awscli
RUN git clone -o github https://github.com/PRX/aws-secrets
RUN cp ./aws-secrets/bin/* /usr/local/bin

ADD ./package.json ./
ADD ./yarn.lock ./

RUN yarn install --ignore-scripts && \
    yarn cache clean && \
    rm -rf /usr/share/man /tmp/* /var/tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

ADD . ./
RUN npm run build
RUN addgroup -g 1000 -S playuser && adduser -u 1000 -S playuser -G playuser
RUN chown -R playuser:playuser $APP_HOME

USER playuser
ENTRYPOINT ["./bin/application"]
CMD [ "serve" ]
