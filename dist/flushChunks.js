'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.assetsFromChunkGroups = exports.concatFilesAtKeys = exports.normalizePath = exports.isUnique = exports.createFilesByModuleId = exports.createFilesByPath = exports.flushWebpack = exports.flushBabel = exports.flush = exports.flushFilesPure = exports.flushFiles = exports.flushChunks = undefined

var _createApiWithCss = require('./createApiWithCss')

var _createApiWithCss2 = _interopRequireDefault(_createApiWithCss)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i]
    }
    return arr2
  } else {
    return Array.from(arr)
  }
}

var filesByPath = null
var filesByModuleId = null

var IS_WEBPACK = typeof __webpack_require__ !== 'undefined'
var IS_TEST = process.env.NODE_ENV === 'test'
var defaults = {
  before: ['bootstrap', 'vendor'],
  after: ['main']
}

/** PUBLIC API */

exports.default = function(stats, opts) {
  return flushChunks(stats, IS_WEBPACK, opts)
}

var flushChunks = function flushChunks(stats, isWebpack) {
  var opts = arguments.length > 2 && arguments[2] !== undefined
    ? arguments[2]
    : {}

  var beforeEntries = opts.before || defaults.before
  var afc = function afc(chunkGroupNames, isWebpack) {
    return assetsFromChunkGroups(chunkGroupNames, stats, isWebpack)
  }

  var jsBefore = afc(beforeEntries)

  var files = opts.chunkNames
    ? afc(opts.chunkNames, true)
    : flush(opts.moduleIds || [], stats, opts.rootDir, isWebpack)

  var afterEntries = opts.after || defaults.after
  var jsAfter = afc(afterEntries)

  return (0, _createApiWithCss2.default)(
    []
      .concat(
        _toConsumableArray(jsBefore),
        _toConsumableArray(files),
        _toConsumableArray(jsAfter)
      )
      .filter(isUnique),
    []
      .concat(
        _toConsumableArray(jsBefore),
        _toConsumableArray(jsAfter.reverse()),
        _toConsumableArray(files)
      )
      .filter(isUnique),
    stats,
    opts.outputPath
  )
}

var flushFiles = function flushFiles(stats, opts) {
  return flushFilesPure(stats, IS_WEBPACK, opts)
}

var flushFilesPure = function flushFilesPure(stats, isWebpack, opts) {
  var files = opts.chunkNames
    ? assetsFromChunkGroups(opts.chunkNames, stats)
    : flush(opts.moduleIds || [], stats, opts.rootDir, isWebpack)

  var filter = opts.filter

  if (filter) {
    if (typeof filter === 'function') {
      return files.filter(filter)
    }

    var regex = filter instanceof RegExp
      ? filter
      : new RegExp('.' + filter + '$')
    return files.filter(function(file) {
      return regex.test(file)
    })
  }

  return files
}

/** BABEL VS. WEBPACK FLUSHING */

var flush = function flush(moduleIds, stats, rootDir, isWebpack) {
  return !isWebpack
    ? flushBabel(moduleIds, stats, rootDir).filter(isUnique)
    : flushWebpack(moduleIds, stats).filter(isUnique)
}

var flushBabel = function flushBabel(paths, stats, rootDir) {
  if (!rootDir) {
    throw new Error(
      'No `rootDir` was provided as an option to `flushChunks`.\n      Please provide one so modules rendered server-side can be\n      paired to their webpack equivalents client-side, and their\n      corresponding chunks.'
    )
  }

  var dir = rootDir // satisfy flow

  filesByPath = filesByPath && !IS_TEST
    ? filesByPath // cached
    : createFilesByPath(stats)

  return concatFilesAtKeys(
    filesByPath,
    paths.map(function(p) {
      return normalizePath(p, dir)
    })
  )
}

var flushWebpack = function flushWebpack(ids, stats) {
  filesByModuleId = filesByModuleId && !IS_TEST
    ? filesByModuleId // cached
    : createFilesByModuleId(stats)

  return concatFilesAtKeys(filesByModuleId, ids)
}

/** CREATE FILES MAP */
var filesByChunk = function filesByChunk(chunks) {
  return chunks.reduce(function(chunks, chunk) {
    chunks[chunk.id] = chunk.files
    return chunks
  }, {})
}

var createFilesByPath = function createFilesByPath(_ref) {
  var chunks = _ref.chunks, modules = _ref.modules

  var chunkedFiles = filesByChunk(chunks)
  return modules.reduce(function(filesByPath, module) {
    var filePath = module.name
    var files = concatFilesAtKeys(chunkedFiles, module.chunks)

    filesByPath[filePath] = files.filter(isUnique)
    return filesByPath
  }, {})
}

var createFilesByModuleId = function createFilesByModuleId(stats) {
  var filesByPath = createFilesByPath(stats)

  return stats.modules.reduce(function(filesByModuleId, module) {
    var filePath = module.name
    var id = module.id

    filesByModuleId[id] = filesByPath[filePath]
    return filesByModuleId
  }, {})
}

var findChunkById = function findChunkById(_ref2) {
  var chunks = _ref2.chunks

  if (!chunks) {
    return {}
  }
  return filesByChunk(chunks)
}

/** HELPERS */

var isUnique = function isUnique(v, i, self) {
  return self.indexOf(v) === i
}

var normalizePath = function normalizePath(path, rootDir) {
  return path.replace(rootDir, '.').replace(/\.js$/, '') + '.js'
}

var concatFilesAtKeys = function concatFilesAtKeys(
  inputFilesMap,
  pathsOrIdsOrChunks
) {
  return pathsOrIdsOrChunks.reduce(function(files, key) {
    return files.concat(inputFilesMap[key] || [])
  }, [])
}

var chunksForChunkGroupName = function chunksForChunkGroupName(
  name,
  namedChunkGroups
) {
  if (!namedChunkGroups || !namedChunkGroups[name]) {
    return [name]
  }

  return namedChunkGroups[name].chunks
}

var hasChunkGroup = function hasChunkGroup(
  entry,
  namedChunkGroups,
  checkChunkNames
) {
  var result = !!namedChunkGroups[entry]
  if (!result && checkChunkNames) {
    console.warn(
      '[FLUSH CHUNKS]: Unable to find ' +
        entry +
        ' in Webpack chunks. Please check usage of Babel plugin.'
    )
  }

  return result
}

var chunkNamesForChunkGroupNames = function chunkNamesForChunkGroupNames(
  _ref3
) {
  var chunkNames = _ref3.chunkNames,
    stats = _ref3.stats,
    checkChunkNames = _ref3.checkChunkNames
  return chunkNames
    .reduce(function(names, name) {
      if (!hasChunkGroup(name, stats.namedChunkGroups, checkChunkNames)) {
        return names
      }
      names = names.concat(
        chunksForChunkGroupName(name, stats.namedChunkGroups)
      )
      return names
    }, [])
    .filter(isUnique)
}

var assetsFromChunkGroups = function assetsFromChunkGroups(
  chunkNames,
  stats,
  checkChunkNames
) {
  var _ref4

  var chunksByID = findChunkById(stats)

  var entryToFiles = function entryToFiles(entry) {
    if (typeof entry === 'number') {
      return chunksByID[entry]
    }
    return (
      stats.assetsByChunkName[entry] || stats.assetsByChunkName[entry + '-']
    )
  }

  var chunksWithAssets = chunkNamesForChunkGroupNames({
    chunkNames: chunkNames,
    stats: stats,
    checkChunkNames: checkChunkNames
  })

  return (_ref4 = []).concat
    .apply(_ref4, _toConsumableArray(chunksWithAssets.map(entryToFiles)))
    .filter(function(chunk) {
      return chunk
    })
}

/** EXPORTS FOR TESTS */

exports.flushChunks = flushChunks
exports.flushFiles = flushFiles
exports.flushFilesPure = flushFilesPure
exports.flush = flush
exports.flushBabel = flushBabel
exports.flushWebpack = flushWebpack
exports.createFilesByPath = createFilesByPath
exports.createFilesByModuleId = createFilesByModuleId
exports.isUnique = isUnique
exports.normalizePath = normalizePath
exports.concatFilesAtKeys = concatFilesAtKeys
exports.assetsFromChunkGroups = assetsFromChunkGroups