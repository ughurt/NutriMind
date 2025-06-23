// This is a minimal shim for the tls module in a React Native environment
export default {
  connect: () => {
    throw new Error('tls.connect is not supported in React Native');
  }
}; 