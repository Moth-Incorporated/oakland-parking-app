export class Banner {
  private timer = 0;

  constructor(private el: HTMLElement) {}

  show(message: string, ms = 2800): void {
    this.el.textContent = message;
    this.el.dataset.show = 'true';
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      delete this.el.dataset.show;
    }, ms);
  }
}