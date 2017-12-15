let wrap = require('./wrap.js')
let Tree = require('./tree.js')
let MutationStore = require('./mutationStore.js')
let { symbols } = require('./common.js')

async function createMerk (db) {
  if (!db || db.toString() !== 'LevelUP') {
    throw Error('Must provide a LevelUP instance')
  }

  let mutations = MutationStore()

  // TODO: decouple state wrapper from tree
  // (could be used with any LevelUp)
  let tree = new Tree(db)
  // TODO: load all keys

  let root = {
    [symbols.mutations]: () => mutations,
    [symbols.root]: () => root,
    [symbols.db]: () => tree
  }

  let onMutate = (mutation) => mutations.mutate(mutation)
  return wrap(root, onMutate)
}

function assertRoot (root) {
  if (root[symbols.mutations] != null) return
  throw Error('Must specify a root merk object')
}

// revert to last commit
function rollback (root) {
  assertRoot(root)
  let mutations = root[symbols.mutations]()
  let unwrappedRoot = root[symbols.root]()
  mutations.rollback(unwrappedRoot)
}

// flush to db
function commit (root) {
  assertRoot(root)
  let mutations = root[symbols.mutations]()
  let db = root[symbols.db]()
  return mutations.commit(db)
}

// returns merkle root
function hash (root) {
  assertRoot(root)
  let tree = root[symbols.db]()
  return tree.rootHash()
}

function getter (symbol) {
  return function (root) {
    assertRoot(root)
    return root[symbol]()
  }
}

module.exports = Object.assign(createMerk, {
  mutations: getter(symbols.mutations),
  rollback,
  commit,
  hash
})
