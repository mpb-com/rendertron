class SingletonCounter {
  private count: number;
  private concurrency: number;

  // Starting at 3 as the first actual render will be number 4
  public constructor(initialCount = 3) {
    this.count = initialCount;
    this.concurrency = 0;
  }

  public increase(): CounterState {
    this.count++;
    this.concurrency++;
    return { count: this.count, concurrency: this.concurrency };
  }

  public decrease(): CounterState {
    this.concurrency--;
    return { count: this.count, concurrency: this.concurrency };
  }

  public getCounts(): CounterState {
    return { count: this.count, concurrency: this.concurrency };
  }
}

type CounterState = {
  count: number;
  concurrency: number;
}

export default new SingletonCounter() ;