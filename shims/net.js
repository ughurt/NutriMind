// This is a minimal shim for the net module in a React Native environment
export default {
  connect: () => {
    throw new Error('net.connect is not supported in React Native');
  },
  isIP: () => false
}; 