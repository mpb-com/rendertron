class SingletonCounter {
  private static instance: SingletonCounter;
  private count: number;
  private concurrency: number;

  // Starting at 3 as the first actual render will be number 4
  private constructor(initialCount = 3) {
    this.count = initialCount;
    this.concurrency = 0;
  }

  public static getInstance(): SingletonCounter {
    if (!SingletonCounter.instance) {
      SingletonCounter.instance = new SingletonCounter();
    }
    return SingletonCounter.instance;
  }

  public start(): CounterState {
    this.count++;
    this.concurrency++;
    return { count: this.count, concurrency: this.concurrency };
  }

  public end(): CounterState {
    this.concurrency--;
    return { count: this.count, concurrency: this.concurrency };
  }
}

interface CounterState {
  count: number;
  concurrency: number;
}

export default SingletonCounter;