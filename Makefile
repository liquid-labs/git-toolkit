.DELETE_ON_ERROR:
.PHONY: all build lint lint-fix qa test

default: build

CATALYST_SCRIPTS:=npx catalyst-scripts

GIT_TOOLKIT_SRC:=src
GIT_TOOLKIT_FILES:=$(shell find $(GIT_TOOLKIT_SRC) \( -name "*.js" -o -name "*.mjs" \) -not -path "*/test/*" -not -name "*.test.js")
GIT_TOOLKIT_ALL_FILES:=$(shell find $(GIT_TOOLKIT_SRC) \( -name "*.js" -o -name "*.mjs" \))
GIT_TOOLKIT_TEST_SRC_FILES:=$(shell find $(GIT_TOOLKIT_SRC) -name "*.js")
GIT_TOOLKIT_TEST_BUILT_FILES:=$(patsubst $(GIT_TOOLKIT_SRC)/%, test-staging/%, $(GIT_TOOLKIT_TEST_SRC_FILES))
#GIT_TOOLKIT_TEST_SRC_DATA:=$(shell find $(GIT_TOOLKIT_SRC) -path "*/test/data/*" -type f)
#GIT_TOOLKIT_TEST_BUILT_DATA:=$(patsubst $(GIT_TOOLKIT_SRC)/%, test-staging/%, $(GIT_TOOLKIT_TEST_SRC_DATA))
GIT_TOOLKIT:=dist/liq-projects.js

BUILD_TARGETS:=$(GIT_TOOLKIT)

# build rules
build: $(BUILD_TARGETS)

all: build

$(GIT_TOOLKIT): package.json $(GIT_TOOLKIT_FILES)
	JS_SRC=$(GIT_TOOLKIT_SRC) $(CATALYST_SCRIPTS) build

# test
#$(GIT_TOOLKIT_TEST_BUILT_DATA): test-staging/%: $(GIT_TOOLKIT_SRC)/%
#	@echo "Copying test data..."
#	@mkdir -p $(dir $@)
#	@cp $< $@

$(GIT_TOOLKIT_TEST_BUILT_FILES) &: $(GIT_TOOLKIT_ALL_FILES)
	JS_SRC=$(GIT_TOOLKIT_SRC) $(CATALYST_SCRIPTS) pretest

.test-marker: $(GIT_TOOLKIT_TEST_BUILT_FILES) # $(GIT_TOOLKIT_TEST_BUILT_DATA)
	JS_SRC=test-staging $(CATALYST_SCRIPTS) test
	touch $@

test: .test-marker

# lint rules
.lint-marker: $(GIT_TOOLKIT_ALL_FILES)
	JS_LINT_TARGET=$(GIT_TOOLKIT_SRC) $(CATALYST_SCRIPTS) lint
	touch $@

lint: .lint-marker

lint-fix:
	JS_LINT_TARGET=$(GIT_TOOLKIT_SRC) $(CATALYST_SCRIPTS) lint-fix

qa: test lint
