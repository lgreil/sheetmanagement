<template>
  <div v-if="visible" class="modal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <h2>Add New Stueck</h2>
      <form @submit.prevent="submitAdd">
        <div v-for="(value, key) in newStueck" :key="key" class="form-group">
          <label :for="key">{{ key }}</label>
          <input v-model="newStueck[key]" :id="key" :name="key" type="text" />
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddEntry',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      newStueck: {
        name: '',
        genre: '',
        jahr: '',
        schwierigkeit: '',
        isdigitalisiert: false,
        composer_name: '',
        arranger_name: ''
      },
    };
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    submitAdd() {
      this.$emit('save', this.newStueck);
    },
  },
};
</script>

<style scoped>
.modal {
  display: block;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}
</style>