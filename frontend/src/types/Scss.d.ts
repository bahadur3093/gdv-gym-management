// Tells TypeScript that .scss files are valid modules
// returning an object of class name strings
declare module '*.scss' {
  const styles: { [className: string]: string }
  export default styles
}