

describe('test-test', () => {
  beforeEach(async () => {
    console.log('beforeEach')
  });

  afterEach(async () => {
    console.log('afterEach')
  });

  it('testy', async () => {
    expect("hello").toEqual("hello");
  });

});
