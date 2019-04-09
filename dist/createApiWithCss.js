'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.createCssHash = exports.stylesAsString = exports.isCss = exports.isJs = exports.getJsFileRegex = undefined

var _react = require('react')

var _react2 = _interopRequireDefault(_react)

var _fs = require('fs')

var _fs2 = _interopRequireDefault(_fs)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

var DEV = process.env.NODE_ENV === 'development'

/** CREATE API WITH CSS */

exports.default = function(files, filesOrderedForCss, stats, outputPath) {
  var publicPath = stats.publicPath.replace(/\/$/, '')
  var regex = getJsFileRegex(files)
  var scripts = files.filter(function(file) {
    return isJs(regex, file)
  })
  var stylesheets = filesOrderedForCss.filter(isCss)
  var cssHashRaw = createCssHash(stats)

  var api = {
    // 1) Use as React components using ReactDOM.renderToStaticMarkup, eg:
    // <html><Styles /><Js /><html>
    Js: function Js() {
      return _react2.default.createElement(
        'span',
        null,
        scripts.map(function(file, key) {
          return _react2.default.createElement('script', {
            type: 'text/javascript',
            src: publicPath + '/' + file,
            key: key,
            defer: true
          })
        })
      )
    },
    Styles: function Styles() {
      return _react2.default.createElement(
        'span',
        null,
        stylesheets.map(function(file, key) {
          return _react2.default.createElement('link', {
            rel: 'stylesheet',
            href: publicPath + '/' + file,
            key: key
          })
        })
      )
    },

    // 2) Use as string, eg: `${styles} ${js}`
    js: {
      toString: function toString() {
        return (
          // lazy-loaded in case not used
          scripts
            .map(function(file) {
              return (
                "<script type='text/javascript' src='" +
                publicPath +
                '/' +
                file +
                "' defer='defer'></script>"
              )
            })
            .join('\n')
        )
      }
    },
    styles: {
      toString: function toString() {
        return (
          // lazy-loaded in case not used
          stylesheets
            .map(function(file) {
              return (
                "<link rel='stylesheet' href='" +
                publicPath +
                '/' +
                file +
                "' />"
              )
            })
            .join('\n')
        )
      }
    },

    // 3) Embed the raw css without needing to load another file.
    // Use as a React component (<Css />) or a string (`${css}`):
    // NOTE: during development, HMR requires stylesheets.
    Css: function Css() {
      return DEV
        ? api.Styles()
        : _react2.default.createElement(
            'span',
            null,
            _react2.default.createElement(
              'style',
              null,
              stylesAsString(stylesheets, outputPath)
            )
          )
    },
    css: {
      toString: function toString() {
        return (
          // lazy-loaded in case not used
          DEV
            ? api.styles.toString()
            : '<style>' + stylesAsString(stylesheets, outputPath) + '</style>'
        )
      }
    },

    // 4) names of files without publicPath or outputPath prefixed:
    scripts: scripts,
    stylesheets: stylesheets,

    // 5) for completeness provide the paths even though they were inputs:
    publicPath: publicPath,
    outputPath: outputPath,

    // 6) special goodness for dual-file import()
    cssHashRaw: cssHashRaw,
    CssHash: function CssHash() {
      return _react2.default.createElement('script', {
        type: 'text/javascript',
        dangerouslySetInnerHTML: {
          __html: 'window.__CSS_CHUNKS__ = ' + JSON.stringify(cssHashRaw)
        }
      })
    },
    cssHash: {
      toString: function toString() {
        return (
          "<script type='text/javascript'>window.__CSS_CHUNKS__= " +
          JSON.stringify(cssHashRaw) +
          '</script>'
        )
      }
    }
  }

  return api
}

/** HELPERS */

var getJsFileRegex = (exports.getJsFileRegex = function getJsFileRegex(files) {
  var isUsingExtractCssChunk = !!files.find(function(file) {
    return file.includes('no_css')
  })
  return isUsingExtractCssChunk ? /\.no_css\.js$/ : /\.js$/
})

var isJs = (exports.isJs = function isJs(regex, file) {
  return regex.test(file) && !/\.hot-update\.js$/.test(file)
})

var isCss = (exports.isCss = function isCss(file) {
  return /\.css$/.test(file)
})

var stylesAsString = (exports.stylesAsString = function stylesAsString(
  stylesheets,
  outputPath
) {
  if (!outputPath) {
    throw new Error(
      "No `outputPath` was provided as an option to `flushChunks`.\n      Please provide one so stylesheets can be read from the\n      file system since you're embedding the css as a string."
    )
  }

  var path = outputPath.replace(/\/$/, '')

  return stylesheets
    .map(function(file) {
      var filePath = path + '/' + file
      return _fs2.default.readFileSync(filePath, 'utf8')
    })
    .join('\n')
    .replace(/\/\*# sourceMappingURL=.+\*\//g, '') // hide prod sourcemap err
})

var createCssHash = (exports.createCssHash = function createCssHash(_ref) {
  var assetsByChunkName = _ref.assetsByChunkName, publicPath = _ref.publicPath
  return Object.keys(assetsByChunkName).reduce(function(hash, name) {
    if (!assetsByChunkName[name] || !assetsByChunkName[name].find) return hash
    var file = assetsByChunkName[name].find(function(file) {
      return file.endsWith('.css')
    })
    if (file) hash[name] = '' + publicPath + file
    return hash
  }, {})
})