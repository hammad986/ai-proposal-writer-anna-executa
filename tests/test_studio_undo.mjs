import test from 'node:test'
import assert from 'node:assert/strict'

class StudioHistoryManager {
  constructor(initialSections) {
    this.current = initialSections
    this.undoStack = []
    this.redoStack = []
  }

  commit(newSections) {
    this.undoStack.push(this.current)
    this.redoStack = []
    this.current = newSections
  }

  undo() {
    if (this.undoStack.length === 0) return this.current
    this.redoStack.push(this.current)
    this.current = this.undoStack.pop()
    return this.current
  }

  redo() {
    if (this.redoStack.length === 0) return this.current
    this.undoStack.push(this.current)
    this.current = this.redoStack.pop()
    return this.current
  }

  canUndo() {
    return this.undoStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }
}

test('StudioHistoryManager: Handles undo and redo operations without loss', () => {
  const initial = [{ id: 's1', title: 'Summary', content: 'Initial version' }]
  const manager = new StudioHistoryManager(initial)

  assert.equal(manager.canUndo(), false)
  assert.equal(manager.canRedo(), false)

  // Edit 1
  const edit1 = [{ id: 's1', title: 'Summary', content: 'First edit' }]
  manager.commit(edit1)
  assert.equal(manager.canUndo(), true)
  assert.equal(manager.current[0].content, 'First edit')

  // Edit 2
  const edit2 = [{ id: 's1', title: 'Summary', content: 'Second edit' }]
  manager.commit(edit2)
  assert.equal(manager.current[0].content, 'Second edit')

  // Undo 1 step
  const undone1 = manager.undo()
  assert.equal(undone1[0].content, 'First edit')
  assert.equal(manager.canRedo(), true)

  // Undo 2nd step
  const undone2 = manager.undo()
  assert.equal(undone2[0].content, 'Initial version')
  assert.equal(manager.canUndo(), false)

  // Redo 1 step
  const redone1 = manager.redo()
  assert.equal(redone1[0].content, 'First edit')

  // Redo 2nd step
  const redone2 = manager.redo()
  assert.equal(redone2[0].content, 'Second edit')
  assert.equal(manager.canRedo(), false)
})
