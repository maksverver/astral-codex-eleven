all:
	@echo 'This project does need to be compiled. (You can run `make test` or `make dist`, though!)'

dist:
	./build-dist.sh

test:
	cat extension/js/styles.js extension/js/options.js extension/js/ext-comments.js tests/js/ext-comments-tests.js | node

.PHONY: all dist test
