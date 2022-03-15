<template>
  <div class="image-input">
    <div
      class="image-input__field"
      :class="{'over': isDragOver}"
      @dragover.prevent="onDrag('over')"
      @dragleave="onDrag('leave')"
      @drop.stop="onDrop"
    >
      <input type="file" title @change="onChange">
      <p>画像をドラッグ＆ドロップ
        <br>またはクリックでファイル選択
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["value"],
  data() {
    return {
      isDragOver: false
    };
  },
  computed: {
    image: {
      set(value) {
        this.$emit("input", value);
      },
      get() {
        return this.value;
      }
    }
  },
  methods: {
    onDrag(type) {
      this.isDragOver = type === "over";
    },
    onDrop(event) {
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files.length !== 1 || files[0].type.indexOf("image") !== 0) {
        return;
      }
      this.readImage(files[0]);
    },
    onChange(event) {
      const files = event.target.files;
      if (files.length !== 1 || files[0].type.indexOf("image") !== 0) {
        return;
      }
      this.readImage(files[0]);
    },
    readImage(file) {
      let reader = new FileReader();
      reader.onload = this.loadImage;
      reader.readAsDataURL(file);
    },
    loadImage(e) {
      let image = new Image();
      image.src = e.target.result;
      this.image = image;
    }
  }
};
</script>
<style>
.image-input {
  background-color: #eee;
  width: 300px;
  height: 300px;
}
.image-input__field {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-input__field.over {
  background-color: #666;
}
.image-input__field > input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}
.image-input__field > p {
  color: #aaa;
  text-align: center;
}
</style>
