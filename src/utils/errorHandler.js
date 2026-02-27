// Utility để xử lý và ẩn các lỗi không mong muốn khỏi console

// Lưu trữ console.error gốc
const originalConsoleError = console.error;

// Override console.error để lọc các lỗi không mong muốn
export const setupErrorFiltering = () => {
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Danh sách các lỗi cần ẩn
    const errorsToHide = [
      '401 (Unauthorized)',
      'HTTP error! status: 401',
      'Session expired',
      'requestWithoutAuth',
      'onSubmit'
    ];
    
    // Kiểm tra xem có phải lỗi cần ẩn không
    const shouldHide = errorsToHide.some(errorPattern => 
      message.includes(errorPattern)
    );
    
    // Chỉ hiển thị lỗi nếu không nằm trong danh sách ẩn
    if (!shouldHide) {
      originalConsoleError.apply(console, args);
    }
  };
};

// Khôi phục console.error gốc
export const restoreConsoleError = () => {
  console.error = originalConsoleError;
};

// Xử lý lỗi toàn cục
export const setupGlobalErrorHandler = () => {
  // Xử lý lỗi JavaScript không được catch
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Ẩn các lỗi liên quan đến 401
    if (message.includes('401') || message.includes('Unauthorized')) {
      event.preventDefault();
      return false;
    }
  });
  
  // Xử lý Promise rejection không được catch
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason || '';
    
    // Ẩn các lỗi liên quan đến 401
    if (message.includes('401') || message.includes('Unauthorized')) {
      event.preventDefault();
      return false;
    }
  });
};