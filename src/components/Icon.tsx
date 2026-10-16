import React from 'react';
import {Cpu, HardDrive, MemoryStick, Zap} from 'lucide-react';

const MAP = {cpu: Cpu, zap: Zap, disk: HardDrive, ram: MemoryStick};

export const SpecIcon: React.FC<{name: keyof typeof MAP; size?: number; color?: string}> = ({
  name,
  size = 44,
  color = '#fff',
}) => {
  const C = MAP[name];
  return <C size={size} color={color} strokeWidth={2.2} />;
};
