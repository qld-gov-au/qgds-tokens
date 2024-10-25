describe('sanity check tests', () => {
  beforeEach(async () => {
    console.log('beforeEach')
  });

  afterEach(async () => {
    console.log('afterEach')
  });

  it('test hello', async () => {
    expect("hello").toEqual("hello");
  });

});
