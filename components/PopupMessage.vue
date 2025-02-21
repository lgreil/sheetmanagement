<template>
  <transition name="fade">
    <div
      v-if="visible"
      :class="['alert', 'alert-' + type]"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      class="popup-message"
    >
      {{ message }}
    </div>
  </transition>
</template>

<script>
export default {
  name: 'PopupMessage',
  data() {
    return {
      message: '',
      type: 'success',
      visible: false,
      duration: 3000  // Duration in milliseconds
    };
  },
  methods: {
    showMessage(message, type = 'success') {
      this.message = message;
      this.type = type;
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
      }, this.duration);
    }
  }
};
</script>

<style scoped>
.popup-message {
  position: fixed;
  bottom: 10px;
  right: 10px;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

/* Example alert type styles */
.alert-success {
  background-color: #dff0d8;
  color: #3c763d;
}
.alert-error,
.alert-danger {
  background-color: #f2dede;
  color: #a94442;
}

/* Transition effects */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
