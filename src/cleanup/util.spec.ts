import { expect } from '@open-wc/testing';
import { cleanSCLItems, countBy, identitySort, uniq } from './util.js';

describe('cleanup/util - identitySort', () => {
  let doc: Document;

  beforeEach(async () => {
    doc = await fetch('/test/testfiles/cleanup.scd')
      .then(response => response.text())
      .then(str => new DOMParser().parseFromString(str, 'application/xml'));
  });

  it('sorts DataSet elements by their identity string', () => {
    const dataSets = doc.querySelectorAll('DataSet');
    const orderedDataSets = identitySort(Array.from(dataSets)).map(dataSet =>
      dataSet.getAttribute('name'),
    );
    // Verified through inspection of the identity of each element.
    expect(orderedDataSets).to.eql([
      'GooseDataSet1',
      'GooseDataSet2',
      'LogDataSet1',
      'dataSet',
      'dataSet',
      'GooseDataSet1',
      'PhsMeas1',
      'PhsMeas2',
    ]);
  });
});

describe('cleanup/util - cleanSCLItems', () => {
  let doc: Document;

  beforeEach(() => {
    doc = new DOMParser().parseFromString(
      '<root><A name="first"/><B name="second"/><C name="third"/></root>',
      'application/xml',
    );
  });

  it('creates a Remove action for each supplied element', () => {
    const elements = Array.from(doc.querySelectorAll('A, B, C'));
    const actions = cleanSCLItems(elements);
    expect(actions).to.have.length(3);
    expect(actions[0]).to.deep.equal({ node: elements[0] });
    expect(actions[1]).to.deep.equal({ node: elements[1] });
    expect(actions[2]).to.deep.equal({ node: elements[2] });
  });

  it('returns an empty array when given an empty list', () => {
    expect(cleanSCLItems([])).to.eql([]);
  });

  it('each action node references the original element', () => {
    const el = doc.querySelector('A')!;
    const [action] = cleanSCLItems([el]);
    expect(action.node).to.equal(el);
  });
});

describe('cleanup/util - countBy', () => {
  it('counts the frequency of each distinct string', () => {
    const result = countBy(['a', 'b', 'a', 'c', 'b', 'a']);
    expect(result.get('a')).to.equal(3);
    expect(result.get('b')).to.equal(2);
    expect(result.get('c')).to.equal(1);
  });

  it('returns an empty map for an empty array', () => {
    expect(countBy([])).to.eql(new Map());
  });

  it('handles a single element', () => {
    const result = countBy(['only']);
    expect(result.get('only')).to.equal(1);
    expect(result.size).to.equal(1);
  });

  it('handles all identical strings', () => {
    const result = countBy(['x', 'x', 'x']);
    expect(result.get('x')).to.equal(3);
    expect(result.size).to.equal(1);
  });
});

describe('cleanup/util - uniq', () => {
  it('removes duplicate values', () => {
    expect(uniq([1, 2, 1, 3, 2])).to.eql([1, 2, 3]);
  });

  it('returns the same values when there are no duplicates', () => {
    expect(uniq([1, 2, 3])).to.eql([1, 2, 3]);
  });

  it('handles an empty array', () => {
    expect(uniq([])).to.eql([]);
  });

  it('handles a single element', () => {
    expect(uniq(['only'])).to.eql(['only']);
  });

  it('handles duplicate strings', () => {
    expect(uniq(['a', 'b', 'a', 'c', 'b'])).to.eql(['a', 'b', 'c']);
  });
});
