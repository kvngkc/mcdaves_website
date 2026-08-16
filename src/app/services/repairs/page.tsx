// src/app/services/repairs/page.tsx
import { redirect } from 'next/navigation';

export default function FrameRepairsRedirect() {
  redirect('/services/lens-replacement');
}
