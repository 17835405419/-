//格式化时间
function format(time) {
  //获取年月日，时间
  const data = new Date(time);

  var hour = data.getHours() < 10 ? "0" + data.getHours() : data.getHours();
  var min =
    data.getMinutes() < 10 ? "0" + data.getMinutes() : data.getMinutes();
  var seon =
    data.getSeconds() < 10 ? "0" + data.getSeconds() : data.getSeconds();

  var newDate = hour + ":" + min + ":" + seon;
  return newDate;
}

module.exports = format;
