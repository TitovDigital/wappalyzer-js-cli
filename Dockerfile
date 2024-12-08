FROM alpine:3.20 as dependencies
WORKDIR /home
RUN apk add git
RUN git clone https://github.com/enthec/webappanalyzer


FROM public.ecr.aws/lambda/nodejs:20
# Add dependent repos
COPY --from=dependencies /home/webappanalyzer /var/webappanalyzer

# Install puppeteer
WORKDIR /puppeteer
RUN dnf update -y \
    && dnf install -y wget gnupg \
    && wget -q -O /etc/pki/rpm-gpg/google-linux-signing-key.pub https://dl-ssl.google.com/linux/linux_signing_key.pub \
    && rpm --import /etc/pki/rpm-gpg/google-linux-signing-key.pub \
    && sh -c 'echo -e "[google-chrome]\nname=Google Chrome\nbaseurl=http://dl.google.com/linux/chrome/rpm/stable/\$basearch\nenabled=1\ngpgcheck=1\ngpgkey=https://dl-ssl.google.com/linux/linux_signing_key.pub" > /etc/yum.repos.d/google-chrome.repo' \
    && dnf install -y google-chrome-stable \
    && dnf clean all
RUN npm init -y && npm install puppeteer 

# wappalyzer-js-cli
# Add modules and install  nodejs dependencies
WORKDIR /var/task
ADD package.json *.js *.mjs entrypoint.sh ./
RUN npm install

ENV HOME /tmp
ENV TMPDIR /tmp
ENV PUPPETEER_TMP_DIR /tmp
ENV CHROMIUM_BIN /usr/bin/google-chrome-stable

ENTRYPOINT [ "/bin/sh"]
CMD ["entrypoint.sh" ]