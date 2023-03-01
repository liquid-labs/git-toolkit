/* globals describe expect test */
import * as fsPath from 'node:path'

import {
  compareLocalAndRemoteBranch,
  determineIfUncommittedChanges,
  determineIfUnstagedChanges,
  verifyClean
} from '../status-lib'

describe('compareLocalAndRemoteBranch', () => {
  test.each([
    ['repo_a_clone', 'main', 'synced'],
    ['repo_a_clone', 'local-ahead', 'local ahead'],
    ['repo_a_clone', 'local-behind', 'local behind']
  ])('%s branch %s is %s re remote branch', (repo, branch, expectedResult) => {
    const projectPath = fsPath.join('test-staging', 'data', repo)
    expect(compareLocalAndRemoteBranch({ branch, remote : 'origin', projectPath })).toBe(expectedResult)
  })
})

describe('determineIfUncommittedChanges', () => {
  test.each([
    ['repo_a', false],
    ['repo_d-non-staged', false],
    ['repo_e-uncommitted', true]
  ])('%s has uncommitted changes -> %p', (repo, expectedResult) => {
    const projectPath = fsPath.join('test-staging', 'data', repo)
    expect(determineIfUncommittedChanges({ projectPath })).toBe(expectedResult)
  })
})

describe('determineIfUnstagedChanges', () => {
  test.each([
    ['repo_a', false],
    ['repo_d-non-staged', true],
    ['repo_e-uncommitted', false]
  ])('%s has non-staged changes -> %p', (repo, expectedResult) => {
    const projectPath = fsPath.join('test-staging', 'data', repo)
    expect(determineIfUnstagedChanges({ projectPath })).toBe(expectedResult)
  })
})

describe('verifyClean', () => {
  test.each([
    ['repo_a_clone', 'on not-main branch'],
    ['repo_a_clone_2', 'on main branch']
  ])("'%s' %s is clean", (repo, branch) =>
    expect(() => verifyClean({ projectPath : fsPath.join('test-staging', 'data', repo) })).not.toThrow())
})
