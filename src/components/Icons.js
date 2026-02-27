import React from 'react';
import { FaCoffee, FaLeaf, FaBox, FaClipboardList, FaMapMarkerAlt, FaCalendarAlt, FaEdit, FaTrash, FaSearch, FaFilter, FaSortAmountDown, FaArrowLeft, FaMountain, FaEye, FaEyeSlash, FaStore } from 'react-icons/fa';

// Icon cà phê (cho Header logo)
export const CoffeeIcon = ({ color = '#1F429B', opacity = 1, size = 32 }) => (
  <FaCoffee
    size={size}
    style={{
      color: color,
      opacity: opacity
    }}
  />
);

// Icon chiếc lá (cho GreenBeans)
export const LeafIcon = ({ color = '#09B04B', opacity = 0.6, size = 32 }) => (
  <FaLeaf
    size={size}
    style={{
      color: color,
      opacity: opacity,
      fontWeight: 'bold'
    }}
  />
);

// Icon hộp (cho GreenBatch)
export const BoxIcon = ({ color = '#FBB217', opacity = 0.6, size = 32 }) => (
  <FaBox
    size={size}
    style={{
      color: color,
      opacity: opacity,
      fontWeight: 'bold'
    }}
  />
);

// Icon clipboard (cho CuppingSession)
export const ClipboardIcon = ({ color = '#0158A4', opacity = 0.6, size = 32 }) => (
  <FaClipboardList
    size={size}
    style={{
      color: color,
      opacity: opacity,
      fontWeight: 'bold'
    }}
  />
);

// Icon vị trí
export const LocationIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaMapMarkerAlt
    size={size}
    style={{ color: color }}
  />
);

// Icon lịch
export const CalendarIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaCalendarAlt
    size={size}
    style={{ color: color }}
  />
);

// Icon chỉnh sửa
export const EditIcon = ({ color = '#495057', size = 14 }) => (
  <FaEdit
    size={size}
    style={{ color: color }}
  />
);

// Icon thùng rác
export const TrashIcon = ({ color = '#dc3545', size = 14 }) => (
  <FaTrash
    size={size}
    style={{ color: color }}
  />
);

// Icon tìm kiếm
export const SearchIcon = ({ color = 'white', size = 14 }) => (
  <FaSearch
    size={size}
    style={{ color: color }}
  />
);

// Icon filter
export const FilterIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaFilter
    size={size}
    style={{ color: color }}
  />
);

// Icon sắp xếp
export const SortIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaSortAmountDown
    size={size}
    style={{ color: color }}
  />
);

// Icon mũi tên quay lại
export const ArrowLeftIcon = ({ color = '#6c757d', size = 16 }) => (
  <FaArrowLeft
    size={size}
    style={{ color: color }}
  />
);


export const BeanIcon = ({ color = '#09B04B', size = 14 }) => (
  <FaLeaf
    size={size}
    style={{ color: color }}
  />
);


export const RegionIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaMapMarkerAlt
    size={size}
    style={{ color: color }}
  />
);


export const AltitudeIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaMountain
    size={size}
    style={{ color: color }}
  />
);


export const YearIcon = ({ color = '#6c757d', size = 14 }) => (
  <FaCalendarAlt
    size={size}
    style={{ color: color }}
  />
);

// Icon mắt (hiện mật khẩu)
export const EyeIcon = ({ color = '#6c757d', size = 16 }) => (
  <FaEye
    size={size}
    style={{ color: color }}
  />
);

// Icon mắt gạch (ẩn mật khẩu)
export const EyeSlashIcon = ({ color = '#6c757d', size = 16 }) => (
  <FaEyeSlash
    size={size}
    style={{ color: color }}
  />
);

// Icon cửa hàng (cho Vendor)
export const VendorIcon = ({ color = '#FBB217', opacity = 0.6, size = 32 }) => (
  <FaStore
    size={size}
    style={{
      color: color,
      opacity: opacity,
      fontWeight: 'bold'
    }}
  />
);