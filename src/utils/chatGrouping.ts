import { ChatMessage } from '../types/chat';

export function parseTimestampToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    const parsedDate = Date.parse(timeStr);
    if (!isNaN(parsedDate)) {
      return Math.floor(parsedDate / (1000 * 60));
    }
    return null;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function isWithinTimeWindow(
  time1?: string,
  time2?: string,
  windowMinutes: number = 5
): boolean {
  if (!time1 || !time2) return true;
  const mins1 = parseTimestampToMinutes(time1);
  const mins2 = parseTimestampToMinutes(time2);
  if (mins1 === null || mins2 === null) return true;
  return Math.abs(mins2 - mins1) <= windowMinutes;
}

export interface GroupedMessage {
  message: ChatMessage;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar: boolean;
}

export function getGroupedMessages(
  messages: ChatMessage[],
  timeWindowMinutes: number = 5
): GroupedMessage[] {
  return messages.map((currMsg, i) => {
    const prevMsg = messages[i - 1];
    const nextMsg = messages[i + 1];

    const isSameGroupAsPrev =
      !!prevMsg &&
      prevMsg.sender === currMsg.sender &&
      (currMsg.sender === 'me' || prevMsg.senderName === currMsg.senderName) &&
      isWithinTimeWindow(prevMsg.timestamp, currMsg.timestamp, timeWindowMinutes) &&
      !currMsg.replyTo;

    const isSameGroupAsNext =
      !!nextMsg &&
      nextMsg.sender === currMsg.sender &&
      (currMsg.sender === 'me' || nextMsg.senderName === currMsg.senderName) &&
      isWithinTimeWindow(currMsg.timestamp, nextMsg.timestamp, timeWindowMinutes) &&
      !nextMsg.replyTo;

    const isFirstInGroup = !isSameGroupAsPrev;
    const isLastInGroup = !isSameGroupAsNext;
    const showAvatar = isLastInGroup;

    return {
      message: currMsg,
      isFirstInGroup,
      isLastInGroup,
      showAvatar,
    };
  });
}
