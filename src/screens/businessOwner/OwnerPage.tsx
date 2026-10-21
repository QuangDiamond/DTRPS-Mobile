import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OwnerRoute, OwnerScreenProps } from './types';

const C = { primary:'#00685F', text:'#131B2E', muted:'#64716F', bg:'#FAF8FF', pale:'#E0F5EF', line:'#E5ECEA', gold:'#D79B00' };
const titles: Record<OwnerRoute,string> = {
  'Dashboard':'Tổng quan đối tác','My Business Location':'Địa điểm của tôi','Location Details':'Chi tiết địa điểm',
  'Edit Location':'Chỉnh sửa địa điểm','Manage Service Tags':'Dịch vụ & tiện ích',
  'Location Change Request Details':'Yêu cầu thay đổi','Price / Promotion Management':'Giá & khuyến mãi',
  'Promotion Details':'Chi tiết ưu đãi','Create / Edit Promotion':'Tạo / sửa ưu đãi',
  'Review Management':'Đánh giá địa điểm','Review Details':'Chi tiết đánh giá',
  'Feedback Management':'Phản hồi & góp ý','Feedback Details':'Chi tiết phản hồi',
  'Business Owner Profile':'Hồ sơ đối tác','Edit Business Owner Profile':'Chỉnh sửa hồ sơ',
  'Become Business Owner':'Trở thành đối tác','Business Owner Application':'Đăng ký đối tác',
  'Application Status':'Trạng thái đăng ký','Subscription Management':'Thuê bao của tôi',
  'Subscription Renewal / Payment':'Gia hạn thuê bao','Advertisement Management':'Quản lý quảng cáo',
  'Create / Edit Advertisement':'Tạo / sửa quảng cáo','Advertisement Details / Approval Status':'Chi tiết quảng cáo',
};
const info = (msg:string) => Alert.alert('Bản demo DTRPS',msg);
const showRequest = () => info('Yêu cầu đã được mô phỏng. Chưa gửi tới backend; dữ liệu công khai chưa thay đổi.');
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function I({name,size=22,color=C.primary}:{name:IconName,size?:number,color?:string}) {
  return <MaterialCommunityIcons name={name} size={size} color={color}/>;
}
function Heading({eyebrow,title,description}:{eyebrow:string,title:string,description?:string}) {
  return <View className="rounded-[24px] bg-[#E0F5EF] px-5 py-6 mb-4">
    <Text className="text-[10px] font-extrabold tracking-[2px] text-[#007E73]">{eyebrow.toUpperCase()}</Text>
    <Text className="text-[24px] font-extrabold leading-[32px] text-[#131B2E] mt-2">{title}</Text>
    {description ? <Text className="text-[13px] leading-[21px] text-[#64716F] mt-3">{description}</Text>:null}
  </View>;
}
function Card({children,onPress}:{children:React.ReactNode,onPress?:()=>void}) {
  return <Pressable onPress={onPress} disabled={!onPress} className="bg-white rounded-[20px] border border-[#E5ECEA] p-4 mb-3">{children}</Pressable>;
}
function Txt({children,small=false}:{children:React.ReactNode,small?:boolean}) {
  return <Text className={small?'text-[12px] leading-[19px] text-[#64716F]':'text-[15px] font-bold text-[#131B2E]'}>{children}</Text>;
}
function Notice({children}:{children:React.ReactNode}) {
  return <View className="rounded-2xl bg-[#E5F5F0] p-4 mb-4 flex-row items-start">
    <I name="information-outline" size={18}/><Text className="ml-2 flex-1 text-[12px] leading-[19px] text-[#356D64]">{children}</Text>
  </View>;
}
function Status({value}:{value:'Pending'|'Approved'|'Rejected'|'Active'|'Draft'|'Resolved'}) {
  const bg = value==='Pending'?'#FFF0D5':value==='Rejected'?'#FCE4E3':value==='Draft'?'#EDF0F0':'#DDF4E8';
  const fg = value==='Pending'?'#976207':value==='Rejected'?'#AD3232':value==='Draft'?'#596768':'#00685F';
  const label = {Pending:'Chờ duyệt',Approved:'Đã duyệt',Rejected:'Từ chối',Active:'Đang hoạt động',Draft:'Bản nháp',Resolved:'Đã xử lý'}[value];
  return <View style={{backgroundColor:bg,borderRadius:30,paddingHorizontal:9,paddingVertical:5}}><Text style={{color:fg,fontSize:10,fontWeight:'700'}}>{label}</Text></View>;
}
function Button({title,onPress,secondary=false,disabled=false}:{title:string,onPress:()=>void,secondary?:boolean,disabled?:boolean}) {
  return <Pressable onPress={onPress} disabled={disabled} style={{backgroundColor:disabled?'#B5CBC6':secondary?'#E3F3EF':C.primary,borderRadius:15,padding:15,alignItems:'center',marginBottom:11}}>
    <Text style={{fontWeight:'800',color:secondary?C.primary:'white',fontSize:13}}>{title}</Text>
  </Pressable>;
}
function Field({label,value,onChange,multiline=false,placeholder}:{label:string,value:string,onChange:(v:string)=>void,multiline?:boolean,placeholder?:string}) {
  return <View className="mb-4"><Text className="text-[12px] font-bold text-[#131B2E] mb-2">{label}</Text>
    <TextInput value={value} onChangeText={onChange} multiline={multiline} placeholder={placeholder} placeholderTextColor="#95A19E"
      style={{backgroundColor:'#FAFCFC',borderColor:'#DCE7E4',borderWidth:1,borderRadius:12,paddingHorizontal:13,paddingVertical:12,minHeight:multiline?90:46,textAlignVertical:multiline?'top':'center',color:C.text,fontSize:13}}/>
  </View>;
}
function Entry({title,subtitle,onPress,status,icon='chevron-right'}:{title:string,subtitle?:string,onPress:()=>void,status?:'Pending'|'Approved'|'Rejected'|'Active'|'Draft'|'Resolved',icon?:IconName}) {
  return <Card onPress={onPress}><View className="flex-row items-center justify-between gap-2">
    <View className="flex-1"><Txt>{title}</Txt>{subtitle?<Text className="text-[12px] text-[#64716F] mt-2 leading-[18px]">{subtitle}</Text>:null}</View>
    {status?<Status value={status}/>:<I name={icon} size={20}/>}
  </View></Card>;
}
function Line({label,value}:{label:string,value:string}) {
  return <View className="flex-row justify-between border-t border-[#E9EEEE] py-3 gap-3"><Text className="text-[12px] text-[#64716F] flex-1">{label}</Text><Text className="text-[12px] font-bold text-[#131B2E] flex-1 text-right">{value}</Text></View>;
}
const groups = [
  {title:'Tùy chọn phục vụ',tags:['Ăn tại chỗ','Giao hàng','Mang đi','Đặt chỗ']},
  {title:'Tiện nghi',tags:['Wi-Fi','Chỗ đỗ xe','Chỗ ngồi ngoài trời','Phù hợp gia đình']},
  {title:'Bữa ăn',tags:['Bữa sáng','Bữa trưa','Bữa tối']},
];
const menus: {title:string,route:OwnerRoute,icon:IconName}[] = [
  {title:'Địa điểm của tôi',route:'My Business Location',icon:'map-marker-outline'},
  {title:'Dịch vụ & tiện ích',route:'Manage Service Tags',icon:'tag-outline'},
  {title:'Giá & khuyến mãi',route:'Price / Promotion Management',icon:'ticket-percent-outline'},
  {title:'Đánh giá',route:'Review Management',icon:'star-outline'},
  {title:'Phản hồi khách hàng',route:'Feedback Management',icon:'message-outline'},
  {title:'Thuê bao',route:'Subscription Management',icon:'credit-card-outline'},
  {title:'Quảng cáo',route:'Advertisement Management',icon:'bullhorn-outline'},
  {title:'Hồ sơ đối tác',route:'Business Owner Profile',icon:'account-circle-outline'},
];

export function OwnerPage({route,navigate,goBack}:{route:OwnerRoute}&OwnerScreenProps) {
  const [form,setForm] = useState<Record<string,string>>({
    name:'Heemang Chicken Tân Xã',category:'Nhà hàng',address:'Hạ Bằng, Hà Nội',hours:'09:00 – 00:00',
    phone:'090 123 4567',price:'100.000 – 300.000 ₫/người',description:'Điểm đến ẩm thực với không gian thân thiện.',
    owner:'Hoàng Nam',email:'owner@example.com',title:'Ưu đãi mùa thu 15%',discount:'15',start:'01/10/2026',end:'31/10/2026',
    conditions:'Hóa đơn từ 300.000 ₫',reply:'',adTitle:'Khám phá trải nghiệm mới',adDescription:'Ghé thăm địa điểm của chúng tôi.',
    legal:'',registrationPhone:'',registrationName:'',registrationAddress:''
  });
  const [tags,setTags]=useState<string[]>(['Ăn tại chỗ','Giao hàng','Wi-Fi','Bữa trưa']);
  const [tab,setTab]=useState<'All'|'Pending'|'Resolved'>('All');
  const update=(key:string)=>(value:string)=>setForm(old=>({...old,[key]:value}));
  const field=(label:string,key:string,multiline=false)=><Field label={label} value={form[key]||''} onChange={update(key)} multiline={multiline}/>;
  const goto=(r:OwnerRoute)=>()=>navigate(r);
  function body():React.ReactNode {
    switch(route) {
      case 'Dashboard':return <>
        <Heading eyebrow="SMARTTRAVEL · BUSINESS OWNER" title="Xin chào, đối tác!" description="Tổng quan hoạt động địa điểm và những việc cần xử lý hôm nay."/>
        <View className="flex-row gap-3 mb-4">
          <View className="bg-white rounded-2xl p-4 flex-1"><Text className="text-[26px] font-extrabold text-[#00685F]">4.6 ★</Text><Txt small>Điểm đánh giá</Txt></View>
          <View className="bg-white rounded-2xl p-4 flex-1"><Text className="text-[26px] font-extrabold text-[#00685F]">02</Text><Txt small>Yêu cầu chờ duyệt</Txt></View>
        </View>
        <Entry title="Địa điểm đang hoạt động" subtitle="Heemang Chicken Tân Xã · 1 địa điểm" onPress={goto('My Business Location')} status="Active"/>
        <Txt>Quản lý kinh doanh</Txt><View className="h-3"/>
        {menus.map(m=><Entry key={m.route} title={m.title} onPress={goto(m.route)} icon={m.icon}/>)}
      </>;
      case 'My Business Location':return <>
        <Heading eyebrow="THÔNG TIN ĐỊA ĐIỂM" title="Địa điểm của tôi" description="Mỗi Business Owner quản lý duy nhất một địa điểm."/>
        <Card><View className="flex-row justify-between items-center"><Txt>{form.name}</Txt><Status value="Active"/></View>
          <View className="mt-3"><Line label="Loại hình" value={form.category}/><Line label="Địa chỉ" value={form.address}/><Line label="Giờ mở cửa" value={form.hours}/></View>
        </Card>
        <Button title="Xem chi tiết địa điểm" onPress={goto('Location Details')}/>
        <Button title="Đề xuất chỉnh sửa" onPress={goto('Edit Location')} secondary/>
        <Entry title="Yêu cầu đang chờ duyệt" subtitle="Xem trạng thái và lý do từ chối" status="Pending" onPress={goto('Location Change Request Details')}/>
      </>;
      case 'Location Details':return <>
        <Heading eyebrow="THÔNG TIN ĐANG CÔNG KHAI" title={form.name} description="Nhà hàng · Hạ Bằng, Hà Nội"/>
        <Card><Txt>Thông tin cơ bản</Txt><View className="mt-3">
          <Line label="Địa chỉ" value={form.address}/><Line label="Giờ mở cửa" value={form.hours}/>
          <Line label="Số điện thoại" value={form.phone}/><Line label="Khoảng giá" value={form.price}/><Line label="Mô tả" value={form.description}/>
        </View></Card>
        <Card><Txt>Dịch vụ & tiện ích</Txt><Text className="text-[12px] text-[#64716F] mt-3">{tags.join('  •  ')}</Text></Card>
        <Button title="Chỉnh sửa địa điểm" onPress={goto('Edit Location')}/>
      </>;
      case 'Edit Location':return <>
        <Heading eyebrow="YÊU CẦU CHỈNH SỬA" title="Chỉnh sửa địa điểm" description="Thông tin mới không thay thế dữ liệu công khai trước khi Admin phê duyệt."/>
        <Card>{field('Tên địa điểm','name')}{field('Loại hình','category')}{field('Địa chỉ','address')}{field('Giờ hoạt động','hours')}{field('Số điện thoại','phone')}{field('Khoảng giá','price')}{field('Mô tả','description',true)}</Card>
        <Button title="Chỉnh sửa dịch vụ & tiện ích" onPress={goto('Manage Service Tags')} secondary/>
        <Notice>Gửi yêu cầu sẽ tạo bản thay đổi chờ duyệt; địa điểm vẫn hiển thị thông tin cũ.</Notice>
        <Button title="Gửi Admin phê duyệt →" onPress={showRequest}/>
        <Button title="Xem trạng thái yêu cầu" onPress={goto('Location Change Request Details')} secondary/>
      </>;
      case 'Manage Service Tags':return <>
        <Heading eyebrow="ĐỊA ĐIỂM CỦA BẠN" title="Dịch vụ & tiện ích" description="Chọn nhãn mô tả địa điểm. Thay đổi cần được Admin duyệt."/>
        <Notice>Các tag đang công khai chỉ được cập nhật sau khi Admin chấp thuận.</Notice>
        {groups.map(g=><Card key={g.title}><Txt>{g.title}</Txt><View className="mt-3">{g.tags.map(t=><Pressable key={t} onPress={()=>setTags(old=>old.includes(t)?old.filter(x=>x!==t):[...old,t])} className="flex-row items-center py-2">
          <I name={tags.includes(t)?'checkbox-marked':'checkbox-blank-outline'} size={23}/><Text className="ml-2 text-[13px] text-[#131B2E]">{t}</Text>
        </Pressable>)}</View></Card>)}
        <Button title="Gửi thay đổi tag để phê duyệt" onPress={showRequest}/>
      </>;
      case 'Location Change Request Details':return <>
        <Heading eyebrow="THEO DÕI XÉT DUYỆT" title="Yêu cầu thay đổi" description="Mã yêu cầu: LOC-REQ-2026-001"/>
        <Card><View className="flex-row justify-between items-center"><Txt>Trạng thái yêu cầu</Txt><Status value="Pending"/></View>
          <Line label="Loại yêu cầu" value="Cập nhật thông tin địa điểm"/><Line label="Ngày gửi" value="20/10/2026"/>
          <Line label="Người duyệt" value="Admin DTRPS"/>
        </Card><Card><Txt>So sánh nội dung</Txt><Line label="Thông tin hiện tại" value="09:00 – 22:00"/><Line label="Đề xuất" value="09:00 – 00:00"/></Card>
        <Notice>Admin có thể phê duyệt hoặc từ chối kèm lý do. Thông tin cũ vẫn được công khai trong lúc chờ.</Notice>
        <Button title="Quay về địa điểm" onPress={goto('My Business Location')}/>
      </>;
      case 'Price / Promotion Management':return <>
        <Heading eyebrow="QUẢN LÝ ĐỊA ĐIỂM" title="Giá & khuyến mãi" description="Theo dõi giá tham khảo và ưu đãi dành cho du khách."/>
        <Card><View className="flex-row justify-between"><Txt>Khoảng giá hiện tại</Txt><Status value="Approved"/></View>
          <Text className="text-[22px] font-extrabold text-[#131B2E] mt-4">{form.price}</Text>
          <Button title="Đề xuất cập nhật giá" onPress={goto('Edit Location')} secondary/>
        </Card>
        <Entry title="Ưu đãi mùa thu 15%" subtitle="01/10 – 31/10/2026" status="Approved" onPress={goto('Promotion Details')}/>
        <Entry title="Combo cuối tuần" subtitle="Đang chờ xét duyệt" status="Pending" onPress={goto('Promotion Details')}/>
        <Button title="+ Tạo chương trình khuyến mãi" onPress={goto('Create / Edit Promotion')}/>
      </>;
      case 'Promotion Details':return <>
        <Heading eyebrow="ƯU ĐÃI" title={form.title} description="Chi tiết chương trình khuyến mãi tại địa điểm."/>
        <Card><Status value="Approved"/><View className="mt-4"><Line label="Mức giảm" value={`${form.discount}%`}/><Line label="Bắt đầu" value={form.start}/><Line label="Kết thúc" value={form.end}/><Line label="Điều kiện" value={form.conditions}/></View></Card>
        <Notice>Sửa nội dung ưu đãi cần gửi Admin phê duyệt lại.</Notice>
        <Button title="Chỉnh sửa ưu đãi" onPress={goto('Create / Edit Promotion')}/>
      </>;
      case 'Create / Edit Promotion':return <>
        <Heading eyebrow="BIỂU MẪU ƯU ĐÃI" title="Tạo / sửa khuyến mãi" description="Các ưu đãi mới cần được xét duyệt trước khi hiển thị."/>
        <Card>{field('Tên chương trình','title')}{field('Mức giảm (%)','discount')}{field('Ngày bắt đầu','start')}{field('Ngày kết thúc','end')}{field('Điều kiện áp dụng','conditions',true)}</Card>
        <Button title="Gửi chương trình xét duyệt" onPress={showRequest}/>
      </>;
      case 'Review Management':return <>
        <Heading eyebrow="TRẢI NGHIỆM DU KHÁCH" title="Đánh giá địa điểm" description="Xem điểm sao và nhận xét do người dùng đăng tải."/>
        <Card><View className="flex-row items-center gap-4"><Text className="text-[48px] font-extrabold text-[#131B2E]">4.6</Text>
          <View><Text className="text-[#D79B00] text-[20px]">★★★★★</Text><Txt small>128 đánh giá</Txt></View></View>
          {[['5 sao','78%'],['4 sao','15%'],['3 sao','5%'],['2 sao','1%'],['1 sao','1%']].map(([a,b])=><Line key={a} label={a} value={b}/>)}
        </Card>
        <Entry title="Nguyễn Minh Anh · ★★★★★" subtitle="Không gian đẹp, nhân viên nhiệt tình. Rất đáng ghé!" onPress={goto('Review Details')}/>
        <Entry title="Trần Huy · ★★★★☆" subtitle="Trải nghiệm tốt, hơi đông vào cuối tuần." onPress={goto('Review Details')}/>
      </>;
      case 'Review Details':return <>
        <Heading eyebrow="CHI TIẾT ĐÁNH GIÁ" title="Đánh giá từ du khách"/>
        <Card><Txt>Nguyễn Minh Anh</Txt><Text className="text-[#D79B00] text-[22px] my-3">★★★★★</Text>
          <Txt small>18/10/2026 · 5/5 sao</Txt><Text className="text-[13px] leading-[22px] text-[#131B2E] mt-4">Không gian đẹp, nhân viên nhiệt tình. Rất đáng ghé! Sẽ quay lại trong chuyến đi tiếp theo.</Text>
        </Card><Notice>Business Owner không thể tự chỉnh sửa hoặc xóa điểm sao của khách hàng.</Notice>
        <Button title="Báo cáo đánh giá vi phạm" onPress={()=>info('Chức năng báo cáo cần kết nối API kiểm duyệt.')} secondary/>
      </>;
      case 'Feedback Management':return <>
        <Heading eyebrow="CHĂM SÓC KHÁCH HÀNG" title="Phản hồi & góp ý" description="Tiếp nhận ý kiến và giải quyết phản ánh của khách hàng."/>
        <View className="flex-row gap-2 mb-4">{[['12','Tổng'],['3','Chờ xử lý'],['9','Đã xử lý']].map(([n,t])=><View key={t} className="flex-1 bg-white rounded-2xl p-3 items-center"><Text className="text-[24px] font-extrabold text-[#00685F]">{n}</Text><Txt small>{t}</Txt></View>)}</View>
        <View className="flex-row mb-3">{(['All','Pending','Resolved'] as const).map(t=><Pressable key={t} onPress={()=>setTab(t)} style={{paddingHorizontal:12,paddingVertical:10,borderRadius:20,backgroundColor:tab===t?C.primary:'#fff',marginRight:8}}><Text style={{fontSize:11,color:tab===t?'#fff':C.muted}}>{t==='All'?'Tất cả':t==='Pending'?'Chờ xử lý':'Đã xử lý'}</Text></Pressable>)}</View>
        {tab!=='Resolved'?<Entry title="Thời gian phục vụ lâu" subtitle="Nguyễn Hương · 20/10/2026" status="Pending" onPress={goto('Feedback Details')}/>:null}
        {tab!=='Pending'?<Entry title="Bổ sung chỗ đỗ xe" subtitle="Trần Huy · 18/10/2026" status="Resolved" onPress={goto('Feedback Details')}/>:null}
      </>;
      case 'Feedback Details':return <>
        <Heading eyebrow="PHẢN HỒI KHÁCH HÀNG" title="Thời gian phục vụ lâu" description="Mã phản hồi FB-2026-014"/>
        <Card><View className="flex-row justify-between items-center"><Txt>Nguyễn Hương</Txt><Status value="Pending"/></View>
          <Txt small>20/10/2026 · 14:30</Txt><Text className="text-[13px] leading-[22px] text-[#131B2E] mt-4">Khách phải chờ khá lâu vào giờ cao điểm. Mong nhà hàng có phương án phục vụ nhanh hơn.</Text>
        </Card><Card>{field('Trả lời khách hàng','reply',true)}<Button title="Gửi phản hồi" onPress={()=>form.reply.trim()?info('Đã mô phỏng gửi phản hồi; chưa lưu lên server.'):Alert.alert('Thiếu nội dung','Vui lòng nhập nội dung phản hồi.')}/></Card>
      </>;
      case 'Business Owner Profile':return <>
        <Heading eyebrow="TÀI KHOẢN ĐỐI TÁC" title="Hồ sơ Business Owner" description="Thông tin cá nhân và đại diện kinh doanh."/>
        <Card><View className="items-center mb-4"><I name="account-circle" size={68}/><Txt>{form.owner}</Txt><Txt small>{form.email}</Txt></View>
          <Line label="Số điện thoại" value={form.phone}/><Line label="Địa điểm quản lý" value={form.name}/><Line label="Vai trò" value="Business Owner"/></Card>
        <Button title="Chỉnh sửa hồ sơ" onPress={goto('Edit Business Owner Profile')}/>
        <Entry title="Thuê bao hàng tháng" onPress={goto('Subscription Management')}/>
        <Entry title="Quản lý quảng cáo" onPress={goto('Advertisement Management')}/>
      </>;
      case 'Edit Business Owner Profile':return <>
        <Heading eyebrow="HỒ SƠ ĐỐI TÁC" title="Chỉnh sửa hồ sơ" description="Thông tin cần xác minh sẽ được Admin xem xét trước khi áp dụng."/>
        <Card>{field('Người đại diện','owner')}{field('Email liên hệ','email')}{field('Số điện thoại','phone')}</Card>
        <Notice>Đây là bản demo gửi yêu cầu; chưa cập nhật hồ sơ công khai.</Notice>
        <Button title="Gửi cập nhật" onPress={showRequest}/>
      </>;
      case 'Become Business Owner':return <>
        <Heading eyebrow="CÙNG SMARTTRAVEL PHÁT TRIỂN" title="Bạn muốn trở thành người đồng hành cùng chúng tôi?" description="Giới thiệu địa điểm của bạn đến cộng đồng du lịch và phát triển hoạt động kinh doanh."/>
        {[['storefront-outline','Giới thiệu địa điểm','Tiếp cận thêm khách du lịch.'],['map-marker-radius-outline','Quản lý thông tin','Cập nhật địa chỉ, giờ mở cửa, giá và tiện ích.'],['star-outline','Theo dõi đánh giá','Lắng nghe và cải thiện trải nghiệm.']].map(([icon,title,desc])=><Card key={title}><View className="flex-row items-center"><I name={icon as IconName} size={28}/><View className="ml-3 flex-1"><Txt>{title}</Txt><Txt small>{desc}</Txt></View></View></Card>)}
        <Notice>Đăng ký → Admin xét duyệt → hoàn tất điều kiện thuê bao → kích hoạt quyền Business Owner.</Notice>
        <Button title="Đăng ký trở thành đối tác →" onPress={goto('Business Owner Application')}/>
        <Button title="Theo dõi hồ sơ đăng ký" onPress={goto('Application Status')} secondary/>
      </>;
      case 'Business Owner Application':return <>
        <Heading eyebrow="HỒ SƠ ĐĂNG KÝ" title="Đăng ký đối tác" description="Mỗi tài khoản Business Owner chỉ được quản lý một địa điểm."/>
        <Card>{field('Tên người đại diện','registrationName')}{field('Số điện thoại','registrationPhone')}{field('Tên địa điểm','name')}{field('Địa chỉ địa điểm','registrationAddress')}{field('Mô tả kinh doanh','description',true)}</Card>
        <Notice>Hồ sơ và giấy tờ minh chứng sẽ được Admin xác minh. Phần tải giấy tờ sẽ cần tích hợp chọn tệp khi nối backend.</Notice>
        <Button title="Gửi hồ sơ xét duyệt" onPress={()=>{if(!form.registrationName.trim()||!form.registrationPhone.trim()||!form.registrationAddress.trim()){Alert.alert('Thiếu thông tin','Nhập tên đại diện, số điện thoại và địa chỉ.');return;}showRequest();navigate('Application Status');}}/>
      </>;
      case 'Application Status':return <>
        <Heading eyebrow="THEO DÕI HỒ SƠ" title="Trạng thái đăng ký" description="Theo dõi quá trình Admin xác minh thông tin."/>
        <Card><View className="flex-row justify-between items-center"><Txt>Hồ sơ Business Owner</Txt><Status value="Pending"/></View>
          <Line label="Mã hồ sơ" value="BO-2026-001"/><Line label="Ngày gửi" value="20/10/2026"/><Line label="Bước hiện tại" value="Admin đang xem xét"/></Card>
        <Notice>Nếu hồ sơ bị từ chối, hệ thống cần hiển thị lý do và cho phép chỉnh sửa gửi lại.</Notice>
        <Button title="Xem thông tin đăng ký" onPress={goto('Business Owner Application')} secondary/>
      </>;
      case 'Subscription Management':return <>
        <Heading eyebrow="TÀI KHOẢN BUSINESS OWNER" title="Thuê bao của tôi" description="Theo dõi quyền quản lý địa điểm và thời hạn sử dụng."/>
        <Card><View className="flex-row justify-between items-center"><Txt>Gói Business Owner</Txt><Status value="Active"/></View>
          <Line label="Chu kỳ" value="Hàng tháng"/><Line label="Ngày bắt đầu" value="01/10/2026"/><Line label="Ngày hết hạn" value="31/10/2026"/><Line label="Trạng thái gia hạn" value="Chưa đến kỳ"/></Card>
        <Notice>Chỉ được gia hạn khi hệ thống gửi thông báo. Không cho phép gia hạn trước.</Notice>
        <Button title="Chưa thể gia hạn" disabled onPress={()=>{}}/>
        <Button title="Xem giao diện gia hạn mẫu" onPress={goto('Subscription Renewal / Payment')} secondary/>
      </>;
      case 'Subscription Renewal / Payment':return <>
        <Heading eyebrow="THANH TOÁN" title="Gia hạn thuê bao" description="Màn mô phỏng khi đã nhận thông báo đến kỳ gia hạn."/>
        <Card><Status value="Pending"/><View className="mt-3"><Line label="Gói" value="Business Owner · 1 tháng"/><Line label="Số tiền" value="Theo cấu hình hệ thống"/><Line label="Phương thức" value="Cổng thanh toán"/></View></Card>
        <Notice>Giá chưa được nhóm xác nhận. Không có thanh toán thật trong bản demo này.</Notice>
        <Button title="Tiếp tục thanh toán" onPress={()=>info('Chưa kết nối Payment Gateway. Chỉ kích hoạt nút này khi backend xác nhận đã gửi thông báo gia hạn.')} />
      </>;
      case 'Advertisement Management':return <>
        <Heading eyebrow="TĂNG KHẢ NĂNG TIẾP CẬN" title="Quản lý quảng cáo" description="Theo dõi nội dung quảng bá cho địa điểm duy nhất của bạn."/>
        <Entry title="Quảng bá mùa du lịch" subtitle="Đã thanh toán và được duyệt" status="Approved" onPress={goto('Advertisement Details / Approval Status')}/>
        <Entry title="Chương trình ưu đãi mới" subtitle="Admin đang xem xét nội dung" status="Pending" onPress={goto('Advertisement Details / Approval Status')}/>
        <Button title="+ Tạo quảng cáo" onPress={goto('Create / Edit Advertisement')}/>
        <Notice>DTRPS chỉ có một gói quảng cáo. Nội dung phải được duyệt trước khi hiển thị.</Notice>
      </>;
      case 'Create / Edit Advertisement':return <>
        <Heading eyebrow="NỘI DUNG QUẢNG CÁO" title="Tạo / sửa quảng cáo" description="Giới thiệu địa điểm của bạn đến cộng đồng du lịch."/>
        <Card>{field('Tiêu đề quảng cáo','adTitle')}{field('Mô tả','adDescription',true)}
          <Txt>Ảnh quảng cáo</Txt><Pressable onPress={()=>info('Chức năng chọn ảnh sẽ được tích hợp với expo-image-picker.')} className="mt-3 border border-dashed border-[#A4CFC8] bg-[#F1FAF7] rounded-2xl p-6 items-center"><I name="image-plus-outline" size={27}/><Txt small>Chọn ảnh quảng cáo</Txt></Pressable>
        </Card><Notice>Quảng cáo mới: thanh toán trước khi gửi duyệt. Sửa nội dung đã thanh toán: gửi duyệt lại, không thu phí lần nữa.</Notice>
        <Button title="Lưu bản nháp" onPress={()=>info('Đã mô phỏng lưu bản nháp. Chưa ghi lên backend.')} secondary/>
        <Button title="Tiếp tục thanh toán / gửi duyệt" onPress={()=>info('Chưa kết nối luồng thanh toán và xét duyệt quảng cáo.')}/>
      </>;
      case 'Advertisement Details / Approval Status':return <>
        <Heading eyebrow="CHI TIẾT QUẢNG CÁO" title="Quảng bá mùa du lịch" description="Thông tin chiến dịch và kết quả phê duyệt."/>
        <Card><Status value="Approved"/><View className="rounded-2xl bg-[#00685F] p-5 mt-4 mb-3"><Text className="text-white text-[11px]">SmartTravel</Text><Text className="text-white text-[21px] font-extrabold my-3">Khám phá trải nghiệm tuyệt vời</Text><Text className="text-[#DFFCF3] text-[12px]">Điểm đến đáng nhớ cho hành trình của bạn.</Text></View>
          <Line label="Địa điểm" value={form.name}/><Line label="Thanh toán" value="Đã thanh toán"/><Line label="Kết quả duyệt" value="Approved"/></Card>
        <Notice>Chỉnh sửa quảng cáo sẽ tạo yêu cầu xét duyệt mới.</Notice>
        <Button title="Chỉnh sửa nội dung" onPress={goto('Create / Edit Advertisement')}/>
      </>;
    }
  }
  return <SafeAreaView edges={['top','bottom']} className="flex-1 bg-[#FAF8FF]">
    <View className="h-14 bg-white border-b border-[#E5ECEA] flex-row items-center px-4">
      <Pressable onPress={goBack} className="w-10 h-10 justify-center"><I name="arrow-left" size={25} color={C.text}/></Pressable>
      <Text numberOfLines={1} className="ml-2 flex-1 text-[16px] font-extrabold text-[#131B2E]">{titles[route]}</Text>
    </View>
    <ScrollView className="flex-1" contentContainerStyle={{padding:16,paddingBottom:30}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{body()}</ScrollView>
    <View className="flex-row justify-around items-center bg-white border-t border-[#E5ECEA] py-2">
      {([['view-dashboard-outline','Dashboard'],['map-marker-outline','My Business Location'],['bullhorn-outline','Advertisement Management'],['account-outline','Business Owner Profile']] as [IconName,OwnerRoute][]).map(([icon,r])=><Pressable key={r} onPress={goto(r)} className="items-center px-2 py-1"><I name={icon} color={route===r?C.primary:'#85938F'} size={23}/><Text style={{fontSize:10,color:route===r?C.primary:'#85938F',marginTop:3}}>{r==='Dashboard'?'Tổng quan':r==='My Business Location'?'Địa điểm':r==='Advertisement Management'?'Quảng cáo':'Hồ sơ'}</Text></Pressable>)}
    </View>
  </SafeAreaView>;
}
