FROM jekyll/builder as build

ENV NODE_ENV=development
RUN mkdir /app
RUN chown 1000:1000 /app
WORKDIR /app

COPY --chown=1000:1000 . /app
RUN jekyll build

FROM nginx:1.16.0-alpine
COPY --from=build /app/_site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
