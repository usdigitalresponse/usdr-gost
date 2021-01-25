// https://github.com/bootstrap-vue/bootstrap-vue/issues/1496
module.exports = {
  data() {
    return {
      gripElement: null,
    };
  },
  mounted() {
    let startOffset;
    let thElm;

    Array.prototype.forEach.call(
      document.querySelectorAll('table th'),
      (th) => {
        // eslint-disable-next-line no-param-reassign
        th.style.position = 'relative';

        const grip = document.createElement('div');
        grip.innerHTML = '&nbsp;';
        grip.style.top = 0;
        grip.style.right = 0;
        grip.style.bottom = 0;
        grip.style.width = '5px';
        grip.style.position = 'absolute';
        grip.style.cursor = 'col-resize';
        grip.addEventListener('mousedown', (e) => {
          thElm = th;
          startOffset = th.offsetWidth - e.pageX;
        });

        th.appendChild(grip);
      },
    );

    document.addEventListener('mousemove', (e) => {
      if (thElm) {
        thElm.style.width = `${startOffset + e.pageX}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      thElm = undefined;
    });
  },
  destroyed() {
    // TODO: remove event listeners
    // document.removeEventListener('mousemove');
    // document.removeEventListener('mouseup');
  },
  methods: {
  },
};
