# Deploy this Node.js project to the public folder
PROJECT_NAME=as3
# DEPLOY_PATH= $(HOME)/cmpt433/public/node/$(PROJECT_NAME)-copy
PUBDIR = $(HOME)/cmpt433/public

all: bbb server wav

mini: bbb server

bbb:
	@echo 'CREATE beatbox EXEC OUTPUT TO $(PUBDIR)/beatbox-bbb/'
	make --directory=beatbox-bbb
	@echo ''

server:
	@echo 'COPYING BEATBOX SERVER DIR TO $(PUBDIR)/beatbox-server-copy/'
	@echo ''
	mkdir -p $(PUBDIR)/beatbox-server-copy/ 
	chmod a+rwx $(PUBDIR)/beatbox-server-copy/
	cp -R beatbox-server/* $(PUBDIR)/beatbox-server-copy/
	@echo 'Do not edit any files in this folder; they are copied!'



npm: server 
	@echo ''
	@echo 'INSTALLING REQUIRED NODE PACKAGES'
	@echo 'RUNNING NPM INSTALL IN $(PUBDIR)/beatbox-server-copy/'
	@echo ''
	@echo '(This may take some time)'
	@echo ''
	cd $(PUBDIR)/beatbox-server-copy/ && npm install
	@echo ''



wav:
	@echo 'COPYING AUDIO FILES DIR TO $(PUBDIR)/beatbox-wav-files/'
	@echo ''
	mkdir -p $(PUBDIR)/beatbox-wav-files/
	cp -R beatbox-wav-files/* $(PUBDIR)/beatbox-wav-files/