/* globals describe expect test */
import * as fsPath from 'node:path'

import {
  compareLocalAndRemoteBranch,
  determineIfUncommittedChanges,
  determineIfUnstagedChanges,
  verifyClean,
  verifyLocalChangesSaved
} from '../status-lib'

describe('compareLocalAndRemoteBranch', () => {
  test.each([
    ['repo_a_clone', 'main', 'synced'],
    ['repo_a_clone', 'local-ahead', 'local ahead'],
    ['repo_a_clone', 'local-behind', 'local behind']
  ])('%s branch %s is %s re remote branch', (repo, branch, expectedResult) => {
    const projectPath = fsPath.join(__dirname, 'data', repo)
    expect(compareLocalAndRemoteBranch({ branch, remote : 'origin', projectPath })).toBe(expectedResult)
  })
})

describe('determineIfUncommittedChanges', () => {
  test.each([
    ['repo_a', false],
    ['repo_d-non-staged', false],
    ['repo_e-uncommitted', true],
    ['repo_f-unstaged-delete', false],
    ['repo_g-ustaged-mod', false],
    ['repo_h-uncommitted-delete', true],
    ['repo_i-uncommitted-mod', true]
  ])('%s has uncommitted changes -> %p', (repo, expectedResult) => {
    const projectPath = fsPath.join(__dirname, 'data', repo)
    expect(determineIfUncommittedChanges({ projectPath })).toBe(expectedResult)
  })
})

describe('determineIfUnstagedChanges', () => {
  test.each([
    ['repo_a', false],
    ['repo_d-non-staged', true],
    ['repo_e-uncommitted', false],
    ['repo_f-unstaged-delete', true],
    ['repo_g-ustaged-mod', true],
    ['repo_h-uncommitted-delete', false],
    ['repo_i-uncommitted-mod', false]
  ])('%s has non-staged changes -> %p', (repo, expectedResult) => {
    const projectPath = fsPath.join(__dirname, 'data', repo)
    expect(determineIfUnstagedChanges({ projectPath })).toBe(expectedResult)
  })
})

describe('verifyClean', () => {
  test.each([
    ['repo_a_clone', 'on not-main branch'],
    ['repo_a_clone_2', 'on main branch']
  ])("'%s' %s is clean", (repo, branch) =>
    expect(() => verifyClean({ projectPath : fsPath.join(__dirname, 'data', repo) })).not.toThrow())
})

describe('verifyLocalChangesSaved', () => {
  test.each([
    ['repo_a_clone', 'main', true],
    ['repo_a_clone', 'local-behind', true],
    ['repo_a_clone', 'local-ahead', false],
    ['repo_a_clone', 'local-mixed', false]
  ])("'%s' branch '%s' is saved: %p", (repo, branch, result) => {
    const projectPath = fsPath.join(__dirname, 'data', repo)
    if (result === true) {
      expect(() => verifyLocalChangesSaved({ branch, projectPath })).not.toThrow()
    }
    else {
      expect(() => verifyLocalChangesSaved({ branch, projectPath })).toThrow(/not found in/)
    }
  })
})
