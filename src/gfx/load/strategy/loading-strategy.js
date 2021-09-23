export class LoadingStrategy {
  async load(_path) {
    throw new Error("LoadingStrategy.load() must be implemented");
  }
}
