FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:16.17.1-nslt AS stage
USER root
WORKDIR /opt/build
COPY . .
RUN npm config set registry https://registry.npm.taobao.org && \
    npm install && \
    npm run docs:build

FROM nginx:stable-alpine
COPY --from=stage /opt/build/.vitepress/dist /usr/share/nginx/html

