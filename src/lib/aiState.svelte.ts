class AIState {
  isOpen = $state<boolean>(false);

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

export const aiState = new AIState();
