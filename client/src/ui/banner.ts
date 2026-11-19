// To control the pop ups
export class Banner {
  private el: HTMLElement;
  private timer = 0;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  show(message: string, ms = 2800): void {
    this.el.textContent = message;
    this.el.dataset.show = 'true';
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(this.hide.bind(this), ms);
  }

  private hide(): void {
    delete this.el.dataset.show;
  }
}