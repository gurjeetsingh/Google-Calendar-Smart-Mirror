# Deploy this Node.js project to the public folder
PROJECT_NAME=as3
# DEPLOY_PATH= $(HOME)/cmpt433/public/node/$(PROJECT_NAME)-copy
PUBDIR = $(HOME)/cmpt433/public

all: bbb server npm

mini: bbb server

bbb:
	@echo 'CREATE calendar EXEC OUTPUT TO $(PUBDIR)/calendar-bbb/'
	make --directory=calendar-bbb
	@echo ''
	mkdir -p $(PUBDIR)/calendar-bbb
	chmod a+rwx $(PUBDIR)/calendar-bbb/
	cp -R calendar-bbb/* $(PUBDIR)/calendar-bbb/

server:
	@echo 'COPYING calendar SERVER DIR TO $(PUBDIR)/calendar-server-copy/'
	@echo ''
	mkdir -p $(PUBDIR)/calendar-server-copy/ 
	chmod a+rwx $(PUBDIR)/calendar-server-copy/
	cp -R calendar-server/* $(PUBDIR)/calendar-server-copy/
	@echo 'Do not edit any files in this folder; they are copied!'

	# rm $(PUBDIR)/calendar-server-copy/calendar-api/token.json

npm: server 
	@echo ''
	@echo 'INSTALLING REQUIRED NODE PACKAGES'
	@echo 'RUNNING NPM INSTALL IN $(PUBDIR)/calendar-server-copy/'
	@echo ''
	@echo '(This may take some time)'
	@echo ''
	cd $(PUBDIR)/calendar-server-copy/ && npm install
	@echo ''
	@echo 'RUNNING NPM INSTALL IN $(PUBDIR)/calendar-server-copy/calendar-api/'
	@echo ''
	@echo '(This may take some time)'
	@echo ''
	cd $(PUBDIR)/calendar-server-copy/calendar-api/ && npm install	
